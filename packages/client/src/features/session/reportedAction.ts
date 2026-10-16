import type { ReportError } from '../../shared/errorReporter';

export function reportActionErrors<Args extends unknown[]>({
  action,
  reportError,
}: {
  action: (...args: Args) => Promise<void>;
  reportError: ReportError;
}): (...args: Args) => Promise<void> {
  return async (...args: Args): Promise<void> => {
    try {
      await action(...args);
    } catch (error: unknown) {
      reportError(error);
    }
  };
}
