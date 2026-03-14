'use client';

import { db } from '@/firebase/config';
import { collection, query, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { User } from '@/types/userTypes';
import { mockUsers } from '@/lib/mock-data';
import type { User as FirebaseUser } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const seedUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    // Run the query to check for existing users.
    // This will trigger a Firestore read.
    const snapshot = await getDocs(usersRef).catch(serverError => {
       // If this fails due to permissions, we can't seed.
       // We can assume an admin or the first user will have rights.
       console.warn("Could not check for users, seeding might be blocked by rules.", serverError);
       return null;
    });

    if (snapshot && snapshot.docs.length < mockUsers.length) { // Check if seeding is needed
      console.log('Seeding database with mock users...');
      const batch = writeBatch(db);
      mockUsers.forEach((user) => {
        // Use a new doc ref to let Firestore auto-generate the ID
        const userRef = doc(collection(db, 'users')); 
        batch.set(userRef, user);
      });
      await batch.commit();
      console.log('Database seeded.');
    }
  } catch (error) {
    console.error("Error seeding users:", error);
    // Don't block the app if seeding fails.
    // This could happen due to permissions or network issues.
  }
};

export const authService = {
  getUserById: async (userId: string): Promise<User | null> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }
    return { id: userSnap.id, ...userSnap.data() } as User;
  },

  createUserProfile: async (firebaseUser: FirebaseUser): Promise<User> => {
    const username = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.substring(0, 5)}`);
    const newUser: Omit<User, 'id'> = {
      username: username,
      email: firebaseUser.email!,
      avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200/200`,
      bio: 'Just joined Skill Issue!',
      skillsOffered: [],
      skillsWanted: [],
      learningStyle: [],
      availability: 'Not set yet.',
    };

    const userRef = doc(db, 'users', firebaseUser.uid);
    setDoc(userRef, newUser)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: newUser,
        });
        errorEmitter.emit('permission-error', permissionError);
        // We throw the error here to be caught by the UI and handled.
        throw serverError;
      });

    return {
      id: firebaseUser.uid,
      ...newUser,
    };
  }
};
