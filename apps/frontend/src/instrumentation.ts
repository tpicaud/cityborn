export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { getFrontendServerConfig } = await import('./config/server');
  try {
    getFrontendServerConfig();
  } catch (error: unknown) {
    throw new Error('Invalid frontend server configuration', { cause: error });
  }
}
