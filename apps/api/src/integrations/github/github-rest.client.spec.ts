import { GithubRejectedError } from './github.errors';
import { GithubRestClient } from './github-rest.client';

const COMMIT_SHA = 'a'.repeat(40);
const TREE_SHA = 'b'.repeat(40);
const BLOB_SHA = 'c'.repeat(40);

function requestUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') {
        return input;
    }
    if (input instanceof URL) {
        return input.href;
    }
    return input.url;
}

function requestBody(init: RequestInit | undefined): string {
    if (typeof init?.body !== 'string') {
        throw new Error('Expected a string request body');
    }
    return init.body;
}

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

describe('GithubRestClient', () => {
    it('should commit files onto the default branch in one commit', async () => {
        const fetchImpl = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = requestUrl(input);
            const method = init?.method ?? 'GET';
            if (method === 'GET' && url.endsWith('/repos/ada/cv')) {
                return Promise.resolve(jsonResponse(200, { default_branch: 'main' }));
            }
            if (method === 'GET' && url.endsWith('/git/ref/heads/main')) {
                return Promise.resolve(jsonResponse(200, { object: { sha: 'parent-sha' } }));
            }
            if (method === 'GET' && url.endsWith('/git/commits/parent-sha')) {
                return Promise.resolve(jsonResponse(200, { tree: { sha: 'base-tree' } }));
            }
            if (method === 'POST' && url.endsWith('/git/blobs')) {
                return Promise.resolve(jsonResponse(201, { sha: BLOB_SHA }));
            }
            if (method === 'POST' && url.endsWith('/git/trees')) {
                return Promise.resolve(jsonResponse(201, { sha: TREE_SHA }));
            }
            if (method === 'POST' && url.endsWith('/git/commits')) {
                return Promise.resolve(jsonResponse(201, { sha: COMMIT_SHA }));
            }
            if (method === 'PATCH' && url.endsWith('/git/ref/heads/main')) {
                return Promise.resolve(jsonResponse(200, { object: { sha: COMMIT_SHA } }));
            }
            return Promise.resolve(jsonResponse(500, {}));
        });
        const client = new GithubRestClient(fetchImpl);

        await expect(
            client.commitFiles({
                repo: 'ada/cv',
                token: 'secret-token',
                message: 'Save base CV',
                files: [
                    { path: 'cvs/base.json', content: '{}\n' },
                    { path: 'cvs/base.html', content: '<html></html>' },
                ],
            }),
        ).resolves.toBe(COMMIT_SHA);

        const treeCall = fetchImpl.mock.calls.find((call) => requestUrl(call[0]).endsWith('/git/trees'));
        const treeBody = JSON.parse(requestBody(treeCall?.[1])) as { base_tree: string; tree: { path: string }[] };
        expect(treeBody.base_tree).toBe('base-tree');
        expect(treeBody.tree.map((entry) => entry.path)).toEqual(['cvs/base.json', 'cvs/base.html']);

        const headers = fetchImpl.mock.calls[0]?.[1]?.headers;
        expect(headers).toMatchObject({ authorization: 'Bearer secret-token' });
    });

    it('should create the first commit when the repository is empty', async () => {
        const fetchImpl = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = requestUrl(input);
            const method = init?.method ?? 'GET';
            if (method === 'GET' && url.endsWith('/repos/ada/cv')) {
                return Promise.resolve(jsonResponse(200, { default_branch: 'main' }));
            }
            if (method === 'GET' && url.endsWith('/git/ref/heads/main')) {
                return Promise.resolve(jsonResponse(409, { message: 'Git Repository is empty.' }));
            }
            if (method === 'POST' && url.endsWith('/git/blobs')) {
                return Promise.resolve(jsonResponse(201, { sha: BLOB_SHA }));
            }
            if (method === 'POST' && url.endsWith('/git/trees')) {
                return Promise.resolve(jsonResponse(201, { sha: TREE_SHA }));
            }
            if (method === 'POST' && url.endsWith('/git/commits')) {
                const body = JSON.parse(requestBody(init)) as { parents: string[] };
                expect(body.parents).toEqual([]);
                return Promise.resolve(jsonResponse(201, { sha: COMMIT_SHA }));
            }
            if (method === 'POST' && url.endsWith('/git/refs')) {
                return Promise.resolve(jsonResponse(201, { ref: 'refs/heads/main' }));
            }
            return Promise.resolve(jsonResponse(500, {}));
        });
        const client = new GithubRestClient(fetchImpl);

        await expect(
            client.commitFiles({
                repo: 'ada/cv',
                token: 'secret-token',
                message: 'Save base CV',
                files: [{ path: 'cvs/base.json', content: '{}\n' }],
            }),
        ).resolves.toBe(COMMIT_SHA);
    });

    it('should return the commit that already contains a path', async () => {
        const fetchImpl = jest.fn((input: RequestInfo | URL) => {
            const url = requestUrl(input);
            expect(url).toContain('/repos/ada/cv/commits?path=cvs%2F2026-10-acme-engineer.json&per_page=1');
            return Promise.resolve(jsonResponse(200, [{ sha: COMMIT_SHA }]));
        });
        const client = new GithubRestClient(fetchImpl);

        const sha = await client.findCommitByPath({
            repo: 'ada/cv',
            token: 'secret-token',
            path: 'cvs/2026-10-acme-engineer.json',
        });

        expect(sha).toBe(COMMIT_SHA);
    });

    it('should report no commit when the path is absent', async () => {
        const fetchImpl = jest.fn(() => Promise.resolve(jsonResponse(200, [])));
        const client = new GithubRestClient(fetchImpl);

        const sha = await client.findCommitByPath({ repo: 'ada/cv', token: 'secret-token', path: 'cvs/missing.json' });

        expect(sha).toBeNull();
    });

    it('should reject an unauthorized repository', async () => {
        const fetchImpl = jest.fn(() => Promise.resolve(jsonResponse(401, { message: 'Bad credentials' })));
        const client = new GithubRestClient(fetchImpl);

        await expect(
            client.commitFiles({
                repo: 'ada/cv',
                token: 'secret-token',
                message: 'Save base CV',
                files: [{ path: 'cvs/base.json', content: '{}\n' }],
            }),
        ).rejects.toBeInstanceOf(GithubRejectedError);
    });
});
