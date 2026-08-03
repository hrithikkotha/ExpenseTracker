import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Validates and coerces req.body/query/params against a Zod schema shaped as
 * `{ body?, query?, params? }`. Writes the parsed values back so downstream
 * handlers receive sanitized, typed data. Zod errors are handled centrally.
 */
export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    console.log('🟡 Validate middleware: validating request');
    console.log('🟡 Request path:', req.path);
    console.log('🟡 Request body before validation:', JSON.stringify(req.body, null, 2));

    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    }) as { body?: unknown; query?: unknown; params?: unknown };

    if (parsed.body !== undefined) req.body = parsed.body;
    // req.query / req.params are read-only setters in some setups; assign only
    // when present to avoid throwing on Express 4's writable query object.
    if (parsed.query !== undefined) {
      Object.assign(req.query, parsed.query);
    }
    if (parsed.params !== undefined) {
      Object.assign(req.params, parsed.params);
    }

    console.log('🟡 Validate middleware: validation passed');
    next();
  };
