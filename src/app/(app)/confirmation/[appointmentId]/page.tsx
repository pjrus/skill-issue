"use client";

import { useState, useEffect, use } from 'react';
import { useUser } from '@/firebase';
import type { Appointment } from '@/types/matchTypes';
import { databaseService } from '@/services/databaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Calendar as CalendarIcon, Clock, Users, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function downloadIcal(appt: Appointment, currentUsername: string, otherUsername: string) {
  const start = formatIcalDate(appt.date);
  const end = formatIcalDate(new Date(appt.date.getTime() + 60 * 60 * 1000));
  const now = formatIcalDate(new Date());
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skill-Issue//Skill-Issue//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appt.id}@skill-issue.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Skill Swap with ${otherUsername}`,
    `DESCRIPTION:Skill swap session between ${currentUsername} and ${otherUsername}.\\nMeet link: ${appt.meetLink}`,
    `URL:${appt.meetLink}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skill-swap-${otherUsername}-${format(appt.date, 'yyyy-MM-dd')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function ConfirmationSkeleton() {
    return(
        <div className="container py-10 max-w-2xl mx-auto">
            <Card>
                <CardHeader className="items-center text-center">
                    <Skeleton className="h-12 w-12 rounded-full mb-2" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-16 w-16 rounded-full" />
                    </div>
                     <div className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                         <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function ConfirmationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    databaseService.getAppointment(appointmentId).then(setAppointment);
  }, [appointmentId]);

  if (!currentUser || !appointment) return <ConfirmationSkeleton />;

  const otherUser = appointment.users.find(u => u.id !== currentUser.id);

  if (!otherUser) return <div>Error: Match details not found.</div>;

  return (
    <div className="container py-10 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
          <CardTitle className="text-2xl">Session Confirmed!</CardTitle>
          <CardDescription>Your skill swap session with {otherUser.username} is booked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-center items-center gap-4 text-lg font-medium">
                <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={currentUser.avatarUrl} />
                        <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>You</span>
                </div>
                 <Users className="text-muted-foreground"/>
                <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={otherUser.avatarUrl} />
                        <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <span>{otherUser.username}</span>
                </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-secondary/50">
                 <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{format(appointment.date, 'eeee, MMMM d, yyyy')}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{format(appointment.date, 'h:mm a')}</span>
                </div>
            </div>

             <Button asChild size="lg" className="w-full">
                <a href={appointment.meetLink} target="_blank" rel="noopener noreferrer">
                    Join Google Meet
                    <ExternalLink className="ml-2 h-4 w-4" />
                </a>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => downloadIcal(appointment, currentUser.username, otherUser.username)}
              >
                <Download className="h-4 w-4" />
                Download .ics
              </Button>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push('/bookings')}
              >
                Done
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">A calendar invite has been sent to your email (simulated).</p>
        </CardContent>
      </Card>
    </div>
  );
}
