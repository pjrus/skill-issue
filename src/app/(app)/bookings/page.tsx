"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { databaseService } from '@/services/databaseService';
import type { Appointment } from '@/types/matchTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Download, Video, CalendarCheck } from 'lucide-react';
import { format, addHours } from 'date-fns';

export default function BookingsPage() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      databaseService.getUserAppointments(user.id).then((appts) => {
        setAppointments(appts);
        setIsLoading(false);
      });
    }
  }, [user]);

  const generateIcal = (appointment: Appointment) => {
    if (!user) return;
    const otherUser = appointment.users.find(u => u.id !== user.id);
    const title = `SkillSwap Session with ${otherUser?.username || 'User'}`;
    const description = `Your booked skill exchange session.\n\nMeeting Link: ${appointment.meetLink}`;
    
    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const startDate = appointment.date;
    const endDate = addHours(startDate, 1); // Assume 1 hour session
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SkillSwap//EN',
      'BEGIN:VEVENT',
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `URL:${appointment.meetLink}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `skillswap-session-${appointment.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="container py-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
            <CalendarCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Bookings</h1>
            <p className="text-muted-foreground mt-1">Manage your upcoming skill exchange sessions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full max-w-sm mb-2" />
                    <Skeleton className="h-4 w-full max-w-xs" />
                </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed bg-muted/20">
            <CardHeader>
                <div className="mx-auto bg-background p-4 rounded-full shadow-sm mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">No Bookings Yet</CardTitle>
                <CardDescription className="max-w-md mx-auto mt-2 text-base">
                    You haven't scheduled any skill exchange sessions. Head over to the home page to find a match and book your first session!
                </CardDescription>
            </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appointment) => {
            const otherUser = appointment.users.find(u => u.id !== user.id);
            if (!otherUser) return null;
            
            const isPast = appointment.date < new Date();

            return (
              <Card key={appointment.id} className={`overflow-hidden transition-all hover:shadow-md ${isPast ? 'opacity-70 bg-muted/30' : 'bg-card'}`}>
                <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-1/3 p-6 bg-muted/10 border-r flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-2 text-foreground font-medium text-lg">
                            <Calendar className="h-5 w-5 text-primary" />
                            {format(appointment.date, 'EEEE, MMM do')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(appointment.date, 'h:mm a')}
                        </div>
                        <Badge variant={isPast ? "outline" : "default"} className="w-fit mt-2">
                            {isPast ? 'Completed' : appointment.status || 'Scheduled'}
                        </Badge>
                    </div>
                    
                    <div className="sm:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-14 w-14 border shadow-sm">
                                    <AvatarImage src={otherUser.avatarUrl} />
                                    <AvatarFallback>{otherUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-xl tracking-tight">Session with {otherUser.username}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Video className="h-3.5 w-3.5" />
                                        Virtual Meeting
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <Button 
                                variant={isPast ? "outline" : "default"} 
                                className="flex-1 sm:flex-none" 
                                onClick={() => window.open(appointment.meetLink, '_blank')}
                                disabled={isPast}
                            >
                                <Video className="mr-2 h-4 w-4" />
                                {isPast ? 'Session Ended' : 'Join Call'}
                            </Button>
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => generateIcal(appointment)}>
                                <Download className="mr-2 h-4 w-4" />
                                Add to Calendar
                            </Button>
                        </div>
                    </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
