"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, Clock } from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import type { Appointment } from '@/types/matchTypes';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function BookingsPage() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Find appointments where the current user is a participant
        const q = query(
          collection(db, 'appointments'),
          where('userIds', 'array-contains', user.id)
        );
        const snapshot = await getDocs(q);
        
        const appts: Appointment[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const appt = await databaseService.getAppointment(docSnap.id);
          if (appt) {
             appts.push(appt);
          }
        }
        
        // Sort by date ascending
        appts.sort((a, b) => a.date.getTime() - b.date.getTime());
        setAppointments(appts);
        
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-2">
          View your upcoming skill-sharing sessions.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
           <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>
      ) : appointments.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <CardHeader>
             <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            <CardTitle>No upcoming bookings</CardTitle>
            <CardDescription>
              Connect with Skill Issuers on the homepage to schedule a session!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appt) => {
             const otherUser = appt.users.find(u => u.id !== user?.id) || appt.users[0];
             
             return (
              <Card key={appt.id}>
                <CardHeader className="flex flex-row items-center gap-4">
                   <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
                    <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Session with {otherUser.username}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                       <Clock className="h-4 w-4" />
                       <span>{appt.date.toLocaleDateString()} at {appt.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <Badge variant={appt.status === 'scheduled' ? 'default' : 'secondary'}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent>
                   <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                     <div className="flex items-center gap-2 font-medium">
                        <Video className="h-5 w-5 text-primary" />
                        Meeting Link
                     </div>
                     <a href={appt.meetLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-sm">
                        {appt.meetLink}
                     </a>
                   </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
