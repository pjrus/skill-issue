'use client';

import { db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import type { User } from '@/types/userTypes';
import { Appointment } from '@/types/matchTypes';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateICS } from '@/utils/calendarUtils';
import { cache, CACHE_TTL } from '@/lib/cache';

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
    return cache.swr('all_users', async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    }, CACHE_TTL.USER_PROFILE);
  },

  getUser: async (id: string): Promise<User | null> => {
    return cache.swr(`user_${id}`, async () => {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
          return null;
      }
      return { id: userSnap.id, ...userSnap.data() } as User;
    }, CACHE_TTL.USER_PROFILE);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User | null> => {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, data)
      .catch(serverError => {
        // Emit a specific permission error to the global emitter for UI notification components
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to allow component-level catch blocks to handle local state
      });

    // Update cache with updated user data on success
    const updatedUser = await databaseService.getUser(id);
    if (updatedUser) {
        const mergedUser = { ...updatedUser, ...data };
        cache.set(`user_${id}`, mergedUser, CACHE_TTL.USER_PROFILE);
        // Also invalidate the all_users cache as it might be stale
        cache.invalidate('all_users');
        return mergedUser;
    }
    return null;
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
    
    // We re-fetch user objects here because the appointment document in Firestore 
    // only stores user IDs (userIds array) for security and scalability.
    // However, the UI expects full User objects in the returned Appointment.
    const user1 = await databaseService.getUser(userIds[0]);
    const user2 = await databaseService.getUser(userIds[1]);

    if (!user1 || !user2) throw new Error("Could not find users for new appointment");

    return {
        ...appointmentData,
        id: newAppointmentRef.id,
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

    const userA = users[0];
    const userB = users[1];

    return {
        ...apptData,
        id: apptSnap.id,
        date: (apptData.date as Timestamp).toDate(),
        users: [userA, userB],
    } as Appointment;
  },

  updateAppointment: async (id: string, data: Partial<Appointment>): Promise<void> => {
    const apptRef = doc(db, 'appointments', id);
    await updateDoc(apptRef, data as any);
  },

  sendBookingConfirmationEmail: async (appointment: Appointment): Promise<void> => {
    // This utilizes the 'Trigger Email' Firebase Extension.
    // By adding a document to the 'mail' collection, the extension 
    // automatically processes it and sends an email via the configured SMTP server (Resend).
    const mailCollection = collection(db, 'mail');
    
    // Generate a Base64-encoded ICS file for calendar integration.
    // This is attached to the email so users can easily add the session to their calendars.
    const icsBase64 = generateICS(appointment);
    
    // Send to each participant
    const emailPromises = appointment.users.map(async (user) => {
      const otherUser = appointment.users.find(u => u.id !== user.id);
      
      const emailDoc = {
        to: user.email,
        message: {
          subject: `Booking Confirmation: Mini-session with ${otherUser?.username}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>Nice! Your skill swap is confirmed.</h2>
              <p>Hello ${user.username},</p>
              <p>You've successfully booked a session with <strong>${otherUser?.username}</strong>.</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Session Details:</strong></p>
                <p style="margin: 5px 0;">Date: ${appointment.date.toLocaleDateString()} at ${appointment.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                ${appointment.meetLink ? `<p style="margin: 5px 0;">Meeting Link: <a href="${appointment.meetLink}">${appointment.meetLink}</a></p>` : ''}
              </div>
              <p>We've attached a calendar invitation to this email for your convenience.</p>
              <p>Happy swapping!</p>
              <p>Best,<br>The SkillSwap Team</p>
            </div>
          `,
          attachments: [
            {
              filename: 'invite.ics',
              content: icsBase64,
              encoding: 'base64',
              contentType: 'text/calendar',
            }
          ]
        },
      };
      
      return addDoc(mailCollection, emailDoc);
    });

    await Promise.all(emailPromises);
  },
};
