// src/common/utils/error.util.ts

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  const message = getErrorMessage(error);

  return new Error(message);
}
