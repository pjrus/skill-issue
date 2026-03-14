"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, Clock, Download, ExternalLink, Copy } from 'lucide-react';
import { Icons } from '@/components/icons';
import { databaseService } from '@/services/databaseService';
import type { Appointment } from '@/types/matchTypes';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format } from 'date-fns';

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function downloadIcal(appt: Appointment, currentUsername: string, otherUsername: string, otherUserEmail: string) {
  const start = formatIcalDate(appt.date);
  const end = formatIcalDate(new Date(appt.date.getTime() + 60 * 60 * 1000)); // 1 hour
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
    `DESCRIPTION:Skill swap session between ${currentUsername} and ${otherUsername} (${otherUserEmail}).\\nMeet link: ${appt.meetLink}`,
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

export default function BookingsPage() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'appointments'),
          where('userIds', 'array-contains', user.id)
        );
        const snapshot = await getDocs(q);
        
        const appts: Appointment[] = [];
        for (const docSnap of snapshot.docs) {
          const appt = await databaseService.getAppointment(docSnap.id);
          if (appt) {
             appts.push(appt);
          }
        }
        
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
                       <span>{format(appt.date, 'EEEE, MMMM d, yyyy')} at {format(appt.date, 'h:mm a')}</span>
                    </div>
                  </div>
                  <Badge variant={appt.status === 'scheduled' ? 'default' : 'secondary'}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent>
                   <MeetLinkSection appt={appt} />
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => downloadIcal(appt, user?.username ?? 'You', otherUser.username, otherUser.email)}
                  >
                    <Download className="h-4 w-4" />
                    Download to Calendar file (.ics)
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MeetLinkSection({ appt }: { appt: Appointment }) {
  const [currentLink, setCurrentLink] = useState(appt.meetLink);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [hasTriedUpgrade, setHasTriedUpgrade] = useState(false);

  useEffect(() => {
    const upgradeLink = async () => {
      if ((currentLink === 'https://meet.google.com/new' || !currentLink) && !hasTriedUpgrade) {
        setIsUpgrading(true);
        setHasTriedUpgrade(true);
        try {
          const response = await fetch('/api/meet/create', { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            if (data.meetLink !== currentLink && data.meetLink !== 'https://meet.google.com/new') {
              await databaseService.updateAppointment(appt.id, { meetLink: data.meetLink });
              setCurrentLink(data.meetLink);
            }
          }
        } catch (error) {
          console.error("Failed to upgrade placeholder link:", error);
        } finally {
          setIsUpgrading(false);
        }
      }
    };
    upgradeLink();
  }, [appt.id, currentLink, hasTriedUpgrade]);

  const isPlaceholder = currentLink === 'https://meet.google.com/new';
  const displayLink = isUpgrading 
    ? 'Generating real meeting link...' 
    : (isPlaceholder ? 'Link generation failed' : (currentLink || 'No link generated yet'));

  return (
    <div className="bg-muted/50 p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Video className="h-5 w-5 text-primary" />
          <span>Meeting Details</span>
        </div>
        {!isPlaceholder && !isUpgrading && currentLink && (
          <Button asChild size="sm" variant="default" className="shadow-sm">
            <a href={currentLink} target="_blank" rel="noopener noreferrer" className="gap-2">
              Join Meeting
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Meeting Link</span>
        <div className="flex items-center gap-2">
          <code className={`text-xs px-2 py-1 rounded border border-border/40 font-mono truncate flex-1 ${isPlaceholder ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-background/50'}`}>
            {displayLink}
          </code>
          {!isPlaceholder && !isUpgrading && currentLink && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(currentLink || '');
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


