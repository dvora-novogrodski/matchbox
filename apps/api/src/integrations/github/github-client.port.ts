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

export type GitHubPathLookup = {
    repo: string;
    token: string;
    path: string;
};

export abstract class GitHubClient {
    abstract commitFiles(input: GitHubCommitInput): Promise<string>;
    /** Latest commit that contains the file, or null when the path is not in the repo. */
    abstract findCommitByPath(input: GitHubPathLookup): Promise<string | null>;
}
