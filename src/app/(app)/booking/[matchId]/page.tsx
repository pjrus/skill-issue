"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { databaseService } from '@/services/databaseService';
import type { User } from '@/types/userTypes';
import { useToast } from '@/hooks/use-toast';
import { add, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, ChevronLeft, Calendar as CalendarIcon, Clock, BookOpen, GraduationCap } from 'lucide-react';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function BookingPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedTeachingSkill, setSelectedTeachingSkill] = useState<string | null>(null);
  const [selectedLearningSkill, setSelectedLearningSkill] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<{ teaching: string[], learning: string[] }>({ teaching: [], learning: [] });
  
  useEffect(() => {
    if (currentUser) {
      const otherUserId = matchId.split('-').find(id => id !== currentUser.id);
      if(otherUserId) {
        databaseService.getUser(otherUserId).then(setOtherUser);
      }
    }
  }, [currentUser, matchId]);

  useEffect(() => {
    if (currentUser && otherUser) {
      const teaching = (currentUser.skillsOffered || []).filter(skill => 
        (otherUser.skillsWanted || []).some(wanted => wanted.toLowerCase() === skill.toLowerCase())
      );
      const learning = (otherUser.skillsOffered || []).filter(skill => 
        (currentUser.skillsWanted || []).some(wanted => wanted.toLowerCase() === skill.toLowerCase())
      );
      setSwaps({ teaching, learning });
      if (teaching.length > 0) setSelectedTeachingSkill(teaching[0]);
      if (learning.length > 0) setSelectedLearningSkill(learning[0]);
    }
  }, [currentUser, otherUser]);

  const handleBooking = async () => {
    if (!date || !selectedTime || !currentUser || !otherUser || !selectedTeachingSkill || !selectedLearningSkill) {
        toast({ variant: 'destructive', title: 'Please select a date, time, and skills to swap.' });
        return;
    }
    setIsLoading(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDateTime = add(date, { hours, minutes });

    try {
        // Attempt to get a real Google Meet link from our API
        let meetLink = '';
        const meetResponse = await fetch('/api/meet/create', { method: 'POST' });
        
        if (!meetResponse.ok) {
          const errorData = await meetResponse.json();
          throw new Error(errorData.details || 'Failed to create Google Meet space');
        }
        
        const meetData = await meetResponse.json();
        meetLink = meetData.meetLink;

        const appointment = await databaseService.createAppointment({
            matchId: matchId,
            users: [currentUser, otherUser],
            date: appointmentDateTime,
            meetLink: meetLink,
            status: 'scheduled',
            teachingSkill: selectedTeachingSkill,
            learningSkill: selectedLearningSkill,
        });

        // Trigger confirmation emails
        await databaseService.sendBookingConfirmationEmail(appointment)
            .catch(err => console.error("Failed to send confirmation emails:", err));

        router.push(`/confirmation/${appointment.id}`);
    } catch (error: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Booking failed', 
          description: error.message || 'Could not create a meeting space. Please check your configuration.' 
        });
        setIsLoading(false);
    }
  }

  if (!currentUser || !otherUser) return <div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container py-8 max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Book a session with {otherUser.username}</h1>
            <p className="text-muted-foreground text-lg">
              Find a time that works for both of you to swap skills and grow together.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Calendar Column */}
          <Card className="lg:col-span-5 border-border/40 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2 font-semibold">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Select Date
              </div>
            </div>
            <CardContent className="p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                showOutsideDays={false}
                className="p-0 border-0 shadow-none bg-transparent"
                disabled={(d) => d < new Date(new Date().toDateString())}
              />
            </CardContent>
          </Card>

          {/* Time Slots Column */}
          <Card className="lg:col-span-7 border-border/40 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-border/40 bg-muted/30 flex justify-between items-center">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Select Time
              </div>
              <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                {date ? format(date, 'MMMM d, yyyy') : 'Pick a date'}
              </div>
            </div>
            
            <CardContent className="p-8 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "group relative h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-200 text-base font-medium",
                      selectedTime === time
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "border-border/40 hover:border-primary/50 hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {time}
                    {selectedTime === time && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Skill Swap Selection */}
              <div className="mt-10 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    What will you teach?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {swaps.teaching.map(skill => (
                      <button
                        key={skill}
                        onClick={() => setSelectedTeachingSkill(skill)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                          selectedTeachingSkill === skill
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "border-border/40 hover:border-primary/30 text-muted-foreground"
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-4 w-4 text-primary" />
                    What will you learn?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {swaps.learning.map(skill => (
                      <button
                        key={skill}
                        onClick={() => setSelectedLearningSkill(skill)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                          selectedLearningSkill === skill
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "border-border/40 hover:border-primary/30 text-muted-foreground"
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Footer Action */}
            <div className="p-8 border-t border-border/40 bg-muted/20">
              <Button 
                onClick={handleBooking} 
                disabled={!date || !selectedTime || isLoading} 
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-xl transition-all duration-300 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Confirm Booking {selectedTime && `for ${selectedTime}`}
                  </>
                )}
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground px-4">
                By confirming, a calendar invite will be sent to both participants.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
