import { createAuthClient } from 'better-auth/react';
import type { auth } from '@/lib/auth';
import { customSessionClient, jwtClient } from 'better-auth/client/plugins';

export const authClient: any = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [jwtClient(), customSessionClient<typeof auth>()]
});
