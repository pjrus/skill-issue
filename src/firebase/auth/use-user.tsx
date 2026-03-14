'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAuth as useFirebaseAuthService } from '@/firebase/provider';
import type { User } from '@/types/userTypes';
import { authService, seedUsers } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  updateUserContext: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        await seedUsers();
        let userProfile = await authService.getUserById(fbUser.uid);
        if (!userProfile) {
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
      router.push('/');
    }
  }, [firebaseUser, isLoading, router, pathname]);

  const updateUserContext = (data: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
  };

  return (
    <UserContext.Provider value={{ user, firebaseUser, isLoading, updateUserContext }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
