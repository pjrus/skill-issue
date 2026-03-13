'use client';
import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(path: string | null | undefined, ...pathSegments: string[]) {
    const firestore = useFirestore();
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const memoizedPath = useMemo(() => path ? [path, ...pathSegments].filter(Boolean).join('/') : null, [path, ...pathSegments]);
    useEffect(() => {
        if (!firestore || !memoizedPath) {
            setIsLoading(false);
            return;
        }

        const ref = doc(firestore, memoizedPath) as DocumentReference<T>;

        const unsubscribe = onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                setData({ ...snapshot.data(), id: snapshot.id });
            } else {
                setData(null);
            }
            setIsLoading(false);
        }, async (error) => {
            console.error(error);
            const permissionError = new FirestorePermissionError({
                path: ref.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, memoizedPath]);

    return { data, isLoading };
}
