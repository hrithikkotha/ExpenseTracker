import { AxiosError } from 'axios';

interface ApiErrorBody {
  success: false;
  error: { code: number; message: string; details?: unknown };
}

/** Extracts a human-readable message from an Axios/API error. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
