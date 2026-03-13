'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAuth as useFirebaseAuthService } from '@/firebase/provider';
import type { User } from '@/types/userTypes';
import { authService, seedUsers } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';

interface UseUser {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  updateUserContext: (data: Partial<User>) => void;
}

export function useUser(): UseUser {
  const auth = useFirebaseAuthService();
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Attempt to seed users if needed. This will only run if an authenticated user is present.
        await seedUsers();
        let userProfile = await authService.getUserById(fbUser.uid);
        if (!userProfile) {
          // If profile doesn't exist, create it.
          userProfile = await authService.createUserProfile(fbUser);
        }
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/login');
    if (!isLoading && !firebaseUser && !isAuthPage) {
      router.push('/login');
    }
    if (!isLoading && firebaseUser && isAuthPage) {
      router.push('/skills');
    }
  }, [firebaseUser, isLoading, router, pathname]);
  
  const updateUserContext = (data: Partial<User>) => {
    if(user) {
      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
    }
  };

  return { user, firebaseUser, isLoading, updateUserContext };
}
