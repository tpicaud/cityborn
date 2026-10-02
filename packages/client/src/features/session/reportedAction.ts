type InvokeError = (error: unknown) => void;

export function reportActionErrors<Args extends unknown[]>(
  action: (...args: Args) => Promise<void>,
  invokeError: InvokeError,
): (...args: Args) => Promise<void> {
  return async (...args: Args): Promise<void> => {
    try {
      await action(...args);
    } catch (error: unknown) {
      invokeError(error);
    }
  };
}
