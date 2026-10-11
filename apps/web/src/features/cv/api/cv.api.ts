import {
    type BaseCv,
    BaseCvSchema,
    type ConnectGithub,
    ConnectGithubSchema,
    type CvEditor,
    CvEditorSchema,
    type CvVersion,
    CvVersionSchema,
    type GithubConnection,
    GithubConnectionSchema,
} from '@matchbox/shared';
import { httpClient } from 'src/lib/http/http-client';

export async function getBaseCv(): Promise<CvEditor> {
    const response = await httpClient.get<unknown>('/cv');
    return CvEditorSchema.parse(response.data);
}

export async function saveBaseCv(selection: BaseCv): Promise<CvEditor> {
    const response = await httpClient.put<unknown>('/cv', selection);
    return CvEditorSchema.parse(response.data);
}

export async function saveCvVersion(): Promise<CvVersion> {
    const response = await httpClient.post<unknown>('/cv/versions');
    return CvVersionSchema.parse(response.data);
}

export async function connectGithub(input: ConnectGithub): Promise<GithubConnection> {
    const response = await httpClient.put<unknown>('/cv/github', input);
    return GithubConnectionSchema.parse(response.data);
}

export async function disconnectGithub(): Promise<void> {
    await httpClient.delete('/cv/github');
}

export async function downloadCvPdf(): Promise<void> {
    const response = await httpClient.get<Blob>('/cv/pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cv.pdf';
    anchor.click();
    URL.revokeObjectURL(url);
}

export function parseBaseCv(selection: BaseCv) {
    return BaseCvSchema.safeParse(selection);
}

export function parseGithubConnection(input: ConnectGithub) {
    return ConnectGithubSchema.safeParse(input);
}
