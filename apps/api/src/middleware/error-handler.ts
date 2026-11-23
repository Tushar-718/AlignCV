import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError("NOT_FOUND", 404, "Route not found"));
};

// Express recognises error middleware by its 4 parameters, so keep `_next`.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  req.log.error({ err }, "Unhandled error");
  // Never leak internals or stack traces to the client.
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
};
