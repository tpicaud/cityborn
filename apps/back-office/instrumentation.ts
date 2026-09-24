export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { getBackOfficeServerConfig } = await import('./config/server');
  try {
    getBackOfficeServerConfig();
  } catch (error: unknown) {
    throw new Error('Invalid back-office server configuration', {
      cause: error,
    });
  }
}
