import {
    BaseCvSchema,
    ConnectGithubSchema,
    CvEditorSchema,
    CvVersionSchema,
    GithubConnectionSchema,
} from '@matchbox/shared';
import { createZodDto } from 'nestjs-zod';

export class CvEditorResponseDto extends createZodDto(CvEditorSchema) {}
export class SaveBaseCvRequestDto extends createZodDto(BaseCvSchema) {}
export class CvVersionResponseDto extends createZodDto(CvVersionSchema) {}
export class ConnectGithubRequestDto extends createZodDto(ConnectGithubSchema) {}
export class GithubConnectionResponseDto extends createZodDto(GithubConnectionSchema) {}
