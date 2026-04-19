import { ErrorCode } from '../errors/ErrorCodes.js';

export type ErrorPayload = {
  statusCode: number;
  code: ErrorCode;
  message: string;
};
