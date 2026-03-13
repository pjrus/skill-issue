'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, Query, DocumentData, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(path: string | null | undefined, ...pathSegments: string[]) {
    const firestore = useFirestore();
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const memoizedPath = useMemo(() => path ? [path, ...pathSegments].filter(Boolean).join('/') : null, [path, ...pathSegments]);

    useEffect(() => {
        if (!firestore || !memoizedPath) {
            setIsLoading(false);
            return;
        }
        
        const ref = collection(firestore, memoizedPath) as CollectionReference<T & { id: string }>;
        
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setData(docs);
            setIsLoading(false);
        }, async (error) => {
            console.error(error);
            const permissionError = new FirestorePermissionError({
                path: ref.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, memoizedPath]);

    return { data, isLoading };
}
