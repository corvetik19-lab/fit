import { z } from "zod";

type FlattenedZodError = ReturnType<z.ZodError["flatten"]>;

export class AdminRouteParamError extends Error {
  code: string;
  details: FlattenedZodError;
  status: number;

  constructor(input: {
    code: string;
    details: FlattenedZodError;
    message: string;
    status?: number;
  }) {
    super(input.message);
    this.name = "AdminRouteParamError";
    this.code = input.code;
    this.details = input.details;
    this.status = input.status ?? 400;
  }
}

const adminUserIdSchema = z.string().uuid();

export function isAdminRouteParamError(
  error: unknown,
): error is AdminRouteParamError {
  return error instanceof AdminRouteParamError;
}

export function parseAdminUserIdParam(
  value: string,
  input: {
    code: string;
    message: string;
  },
) {
  const parsed = adminUserIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new AdminRouteParamError({
      code: input.code,
      details: parsed.error.flatten(),
      message: input.message,
    });
  }

  return parsed.data;
}
