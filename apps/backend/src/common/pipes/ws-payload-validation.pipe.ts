import { ErrorCode } from '@cityborn/api';
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { AnyZodObject } from 'zod';

@Injectable()
export class WsPayloadValidationPipe implements PipeTransform {
  constructor(private readonly payloadSchema: AnyZodObject | undefined) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' || !this.payloadSchema) return value;

    const result = this.payloadSchema.safeParse(value);
    if (result.success) return result.data;

    const fieldErrors: { path: string; message: string }[] =
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

    throw new BadRequestException({
      code: ErrorCode.BAD_REQUEST,
      message: fieldErrors
        .map((field) => `${field.path}: ${field.message}`)
        .join(', '),
      fieldErrors,
    });
  }
}
