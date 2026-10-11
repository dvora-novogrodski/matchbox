import { Injectable } from '@nestjs/common';

import { GithubRejectedError, GithubUnavailableError } from './github.errors';
import { GitHubClient, type GitHubCommitInput } from './github-client.port';

const GITHUB_API = 'https://api.github.com';
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

type GithubResponse = {
    response: Response;
    body: unknown;
};

@Injectable()
export class GithubRestClient extends GitHubClient {
    constructor(private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {
        super();
    }

    async commitFiles(input: GitHubCommitInput): Promise<string> {
        const { owner, name } = parseGithubRepo(input.repo);
        for (const file of input.files) {
            assertSafePath(file.path);
        }

        const repository = await this.request(input.token, `/repos/${owner}/${name}`);
        const branch = readString(repository.body, 'default_branch');
        const refPath = `/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(branch)}`;
        const ref = await this.request(input.token, refPath, undefined, { allowStatuses: [404, 409] });

        const blobShas: string[] = [];
        for (const file of input.files) {
            const blob = await this.request(input.token, `/repos/${owner}/${name}/git/blobs`, {
                method: 'POST',
                body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
            });
            blobShas.push(readString(blob.body, 'sha'));
        }

        const treeBody: Record<string, unknown> = {
            tree: input.files.map((file, index) => ({
                path: file.path,
                mode: '100644',
                type: 'blob',
                sha: blobShas[index],
            })),
        };
        let parents: string[] = [];
        if (ref.response.ok) {
            const parentSha = readString(readObject(ref.body, 'object'), 'sha');
            const parentCommit = await this.request(input.token, `/repos/${owner}/${name}/git/commits/${parentSha}`);
            treeBody.base_tree = readString(readObject(parentCommit.body, 'tree'), 'sha');
            parents = [parentSha];
        }

        const tree = await this.request(input.token, `/repos/${owner}/${name}/git/trees`, {
            method: 'POST',
            body: JSON.stringify(treeBody),
        });
        const commit = await this.request(input.token, `/repos/${owner}/${name}/git/commits`, {
            method: 'POST',
            body: JSON.stringify({
                message: input.message,
                tree: readString(tree.body, 'sha'),
                parents,
            }),
        });
        const sha = readString(commit.body, 'sha');

        if (ref.response.ok) {
            await this.request(input.token, refPath, {
                method: 'PATCH',
                body: JSON.stringify({ sha }),
            });
        } else {
            await this.request(input.token, `/repos/${owner}/${name}/git/refs`, {
                method: 'POST',
                body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
            });
        }

        return sha;
    }

    private async request(
        token: string,
        path: string,
        init?: RequestInit,
        options?: { allowStatuses?: number[] },
    ): Promise<GithubResponse> {
        let response: Response;
        try {
            response = await this.fetchImpl(`${GITHUB_API}${path}`, {
                ...init,
                redirect: 'error',
                signal: AbortSignal.timeout(15_000),
                headers: {
                    accept: 'application/vnd.github+json',
                    authorization: `Bearer ${token}`,
                    'content-type': 'application/json',
                    'user-agent': 'matchbox',
                    'x-github-api-version': '2022-11-28',
                },
            });
        } catch (error) {
            throw new GithubUnavailableError(error);
        }

        const body: unknown = await response.json().catch(() => null);
        if (!response.ok && !options?.allowStatuses?.includes(response.status)) {
            if (response.status === 401 || response.status === 403 || response.status === 404) {
                throw new GithubRejectedError();
            }
            throw new GithubUnavailableError();
        }
        return { response, body };
    }
}

export function parseGithubRepo(repo: string): { owner: string; name: string } {
    if (!REPO_PATTERN.test(repo)) {
        throw new GithubRejectedError();
    }
    const [owner, name] = repo.split('/');
    return { owner, name };
}

function assertSafePath(path: string): void {
    if (path.startsWith('/') || path.includes('\\') || path.split('/').includes('..')) {
        throw new GithubRejectedError();
    }
}

function readObject(value: unknown, key: string): unknown {
    if (typeof value === 'object' && value && key in value) {
        return (value as Record<string, unknown>)[key];
    }
    throw new GithubUnavailableError();
}

function readString(value: unknown, key: string): string {
    const field = readObject(value, key);
    if (typeof field === 'string' && field.length > 0) {
        return field;
    }
    throw new GithubUnavailableError();
}
