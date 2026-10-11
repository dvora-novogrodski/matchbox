export type GitHubCommitFile = {
    path: string;
    content: string;
};

export type GitHubCommitInput = {
    repo: string;
    token: string;
    message: string;
    files: GitHubCommitFile[];
};

export abstract class GitHubClient {
    abstract commitFiles(input: GitHubCommitInput): Promise<string>;
}
