'use client';

import { db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc, Timestamp, query, where } from 'firebase/firestore';
import type { User } from '@/types/userTypes';
import type { Appointment } from '@/types/matchTypes';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper to convert Firestore Timestamps to Dates in appointment objects
const appointmentFromDoc = (docSnap: any): Appointment => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
    } as Appointment;
}

export const databaseService = {
  getUsers: async (): Promise<User[]> => {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    return userList;
  },

  getUser: async (id: string): Promise<User | null> => {
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }
    return { id: userSnap.id, ...userSnap.data() } as User;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User | null> => {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, data)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to allow UI to handle loading/error states
      });

    // Return updated user data on success
    const currentUser = await databaseService.getUser(id);
    return currentUser ? { ...currentUser, ...data } : null;
  },

  createAppointment: async (appointmentData: Omit<Appointment, 'id' | 'users'> & { users: User[] }): Promise<Appointment> => {
    
    const { users, ...rest } = appointmentData;
    const userIds = users.map(u => u.id);

    const dataToSave = {
        ...rest,
        userIds,
        date: Timestamp.fromDate(appointmentData.date)
    };

    const newAppointmentRef = await addDoc(collection(db, 'appointments'), dataToSave)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'appointments',
                operation: 'create',
                requestResourceData: dataToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
    
    // It's not ideal to fetch users again here, but it's the simplest way to match the existing return type
    const user1 = await databaseService.getUser(userIds[0]);
    const user2 = await databaseService.getUser(userIds[1]);

    if (!user1 || !user2) throw new Error("Could not find users for new appointment");

    return {
        id: newAppointmentRef.id,
        ...appointmentData,
        users: [user1, user2],
    };
  },

  getAppointment: async (id: string): Promise<Appointment | null> => {
    const apptRef = doc(db, 'appointments', id);
    const apptSnap = await getDoc(apptRef);
    if (!apptSnap.exists()) {
        return null;
    }
    
    const apptData = apptSnap.data();

    // The appointment in DB only stores user IDs. We need to fetch the full user objects.
    const userIds = apptData.userIds as string[];
    const userPromises = userIds.map(userId => databaseService.getUser(userId));
    const users = (await Promise.all(userPromises)).filter(u => u !== null) as User[];
    
    if (users.length !== 2) {
        console.error("Appointment is linked to an invalid number of users");
        return null;
    }

    return {
        id: apptSnap.id,
        matchId: apptData.matchId,
        date: (apptData.date as Timestamp).toDate(),
        meetLink: apptData.meetLink,
        status: apptData.status,
        users: [users[0], users[1]]
    };
  },

  getUserAppointments: async (userId: string): Promise<Appointment[]> => {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where("userIds", "array-contains", userId));
    const querySnapshot = await getDocs(q);

    // Fetch all unique users involved in these appointments
    const allUserIds = new Set<string>();
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        (data.userIds || []).forEach((id: string) => allUserIds.add(id));
    });

    // Resolve all users 
    const usersMap = new Map<string, User>();
    const userPromises = Array.from(allUserIds).map(async (id) => {
        const user = await databaseService.getUser(id);
        if (user) {
            usersMap.set(id, user);
        }
    });
    
    await Promise.all(userPromises);

    const appointments: Appointment[] = [];
    
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const apptUserIds = data.userIds as string[];
        if (apptUserIds && apptUserIds.length === 2) {
            const user1 = usersMap.get(apptUserIds[0]);
            const user2 = usersMap.get(apptUserIds[1]);
            
            if (user1 && user2) {
                appointments.push({
                    id: docSnap.id,
                    matchId: data.matchId,
                    date: (data.date as Timestamp).toDate(),
                    meetLink: data.meetLink,
                    status: data.status,
                    users: [user1, user2],
                });
            }
        }
    });

    // Sort by date nearest first
    appointments.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return appointments;
  },
};
