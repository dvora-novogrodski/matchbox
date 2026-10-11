import { Module } from '@nestjs/common';

import { GitHubClient } from './github-client.port';
import { GithubRestClient } from './github-rest.client';

@Module({
    providers: [{ provide: GitHubClient, useFactory: () => new GithubRestClient() }],
    exports: [GitHubClient],
})
export class GithubModule {}
