"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { databaseService } from '@/services/databaseService';
import type { User } from '@/types/userTypes';
import { useToast } from '@/hooks/use-toast';
import { add, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function BookingPage({ params }: { params: { matchId: string } }) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      const otherUserId = params.matchId.split('-').find(id => id !== currentUser.id);
      if(otherUserId) {
        databaseService.getUser(otherUserId).then(setOtherUser);
      }
    }
  }, [currentUser, params.matchId]);

  const handleBooking = async () => {
    if (!date || !selectedTime || !currentUser || !otherUser) {
        toast({ variant: 'destructive', title: 'Please select a date and time.' });
        return;
    }
    setIsLoading(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDateTime = add(date, { hours, minutes });

    try {
        const appointment = await databaseService.createAppointment({
            matchId: params.matchId,
            users: [currentUser, otherUser],
            date: appointmentDateTime,
            meetLink: 'https://meet.google.com/new', // Placeholder link
            status: 'scheduled',
        });
        router.push(`/confirmation/${appointment.id}`);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Booking failed', description: 'Please try again later.' });
        setIsLoading(false);
    }
  }

  if (!currentUser || !otherUser) return <div className="container py-10"><Loader2 className="mx-auto mt-10 h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Book a session with {otherUser.username}</CardTitle>
          <CardDescription>Select a date and time that works for both of you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
          <div className="flex flex-col items-center md:items-end justify-start md:w-1/2">
            <div className="bg-card w-fit border rounded-xl shadow-sm overflow-hidden">
                <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-3"
                disabled={(d) => d < new Date(new Date().toDateString())}
                />
            </div>
          </div>
          <div className="space-y-6 md:w-1/2">
            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
                Available Times for {date ? format(date, 'MMM do, yyyy') : 'selected date'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {timeSlots.map(time => (
                    <Button 
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className={cn(selectedTime === time && "bg-primary text-primary-foreground font-semibold shadow-inner")}
                    >
                        {time}
                    </Button>
                ))}
            </div>
          </div>
        </CardContent>
        <CardContent className="flex justify-center">
           <Button onClick={handleBooking} disabled={!date || !selectedTime || isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking for {selectedTime}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
