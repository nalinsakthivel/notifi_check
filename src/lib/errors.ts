export interface FirebaseLikeError {
  message: string;
  code?: string;
  name?: string;
}

export function toFirebaseLikeError(error: unknown): FirebaseLikeError {
  if (error instanceof Error) {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    return { message: error.message, code, name: error.name };
  }
  return { message: String(error) };
}
