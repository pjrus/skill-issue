'use client';

import { FirebaseProvider } from './provider';

// This is a workaround for a Next.js bug that causes context providers to be
// rendered on the server. This forces the provider to be client-side only.
// https://github.com/firebase/firebase-js-sdk/issues/7939
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
