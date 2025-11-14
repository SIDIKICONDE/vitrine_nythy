'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Wrapper pour NextAuth SessionProvider
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

