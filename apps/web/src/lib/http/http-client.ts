import axios from 'axios';

import { env } from '../env';
import { firebaseAuth } from '../firebase/firebase';

type ApiErrorBody = {
  statusCode?: number;
  code?: string;
  message?: string;
  requestId?: string;
  jobId?: string;
};

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly jobId?: string,
  ) {
    super(message);
    this.name = ApiError.name;
  }
}

export const httpClient = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
});

httpClient.interceptors.request.use(async (config) => {
  config.headers.set('x-request-id', crypto.randomUUID());
  const token = await firebaseAuth.currentUser?.getIdToken();
  if (token) {
    config.headers.set('authorization', `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorBody>(error) && error.response) {
      const body = error.response.data;
      return Promise.reject(
        new ApiError(
          body.statusCode ?? error.response.status,
          body.code ?? 'UNKNOWN_ERROR',
          body.message ?? error.message,
          body.requestId,
          body.jobId,
        ),
      );
    }
    return Promise.reject(error instanceof Error ? error : new Error('Unknown HTTP error', { cause: error }));
  },
);
