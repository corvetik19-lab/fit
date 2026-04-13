export function isAuthProviderUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const cause = "cause" in error ? error.cause : null;

  if (!cause || typeof cause !== "object") {
    return false;
  }

  return "code" in cause && cause.code === "ENOTFOUND";
}
