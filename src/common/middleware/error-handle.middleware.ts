/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { type NextFunction, type Request, type Response } from 'express';

import { ErrorResponse } from '../response';
import { normalizeError } from '../utils/error.util';

interface ValidationError {
  path: string[];
  message: string;
}

export const ErrorHandler = (
  error: unknown,
  _: Request,
  response: Response,
  next: NextFunction,
) => {
  const normalizedError = normalizeError(error);
  const isErrorResponse = error instanceof ErrorResponse;
  const errorStatus = isErrorResponse ? error.code : 500;
  const errorMessage = normalizedError.message;

  if (errorStatus === 422) {
    try {
      const validationErrors = JSON.parse(errorMessage) as ValidationError[];
      const message = validationErrors
        .map(error_ => `${error_.message} in field ${error_.path.join(', ')}`)
        .join('. ');
      response.status(errorStatus).json({
        status: false,
        code: errorStatus,
        message,
        stack:
          process.env.NODE_ENV === 'production'
            ? undefined
            : normalizedError.stack,
      });
    } catch {
      response.status(errorStatus).json({
        status: false,
        code: errorStatus,
        message: errorMessage,
        stack:
          process.env.NODE_ENV === 'production'
            ? undefined
            : normalizedError.stack,
      });
    }
  } else {
    response.status(errorStatus).json({
      status: false,
      code: errorStatus,
      message:
        errorStatus >= 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : errorMessage,
      stack:
        process.env.NODE_ENV === 'production'
          ? undefined
          : normalizedError.stack,
    });
  }

  next();
};
