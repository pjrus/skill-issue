'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a real app, you might use a toast to display this error.
      // For development, we'll throw it to get the Next.js overlay.
      if (process.env.NODE_ENV === 'development') {
        console.error("Caught Firestore Permission Error:", error.context);
        const detailedError = new Error(
          `Firestore Permission Denied. Check your security rules.\n` +
          `Operation: ${error.context.operation}\n` +
          `Path: ${error.context.path}\n` +
          `Data: ${JSON.stringify(error.context.requestResourceData, null, 2)}`
        );
        detailedError.name = 'FirestorePermissionError';
        throw detailedError;
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
