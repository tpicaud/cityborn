import { ErrorCode } from '../ErrorCodes.js';

export class ApiError extends Error {
  code: ErrorCode;
  statusCode?: number;
  data?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    data?: any,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
