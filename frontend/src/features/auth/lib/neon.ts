import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const neon = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
});

const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);

export async function getValidToken(): Promise<string> {
  const sessionResponse = await authClient.getSession();
  const token = sessionResponse.data?.session?.token;

  if (!token) {
    throw new Error('User is not authenticated or token is missing');
  }

  return token;
}
