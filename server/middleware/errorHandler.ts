import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Centralized Error Handler caught:", err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on our systems.";

  // Hide detailed stack trace in production environments
  const isProd = process.env.NODE_ENV === "production";

  res.status(status).json({
    error: message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
