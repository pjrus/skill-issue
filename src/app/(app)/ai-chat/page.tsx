"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import type { Match } from '@/types/matchTypes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Send, Wand2, ArrowLeft } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { AIChatInput } from '@/ai/flows/ai-skills-chat';
import type { User } from '@/types/userTypes';

type ChatMessage = {
  role: 'user' | 'model' | 'system';
  content: string;
};

export default function AiChatPage() {
  const router = useRouter();
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<{ offered: string[]; wanted: string[] } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Fetch match data
  const loadUsersForAI = async () => {
    if (user) {
      try {
        const users = await databaseService.getUsers();
        setAllUsers(users.filter(u => u.id !== user.id));
      } catch (e) {
        console.error("Error loading users:", e);
      }
    }
  };

  useEffect(() => {
    loadUsersForAI();
  }, [user]);

  // Init chat
  useEffect(() => {
    if (messages.length === 0 && !isChatting) {
      const offered = user?.skillsOffered?.length ? user.skillsOffered.join(', ') : '';
      const wanted = user?.skillsWanted?.length ? user.skillsWanted.join(', ') : '';
      
      let initialMessage = "What skill are you looking to learn today? Tell me what you can teach and what you want to learn!";
      
      if (offered || wanted) {
        initialMessage = `Welcome back! I see your skills:\n\n`;
        if (offered) initialMessage += `You offer: ${offered}\n`;
        if (wanted) initialMessage += `You want: ${wanted}\n`;
        initialMessage += `\nLooking for something new? Just let me know.`;
      }
      
      setMessages([{ role: 'model', content: initialMessage }]);
    }
  }, [messages.length, isChatting, user]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: inputMessage };
    const currentHistory = [...messages];
    
    setMessages([...currentHistory, newMessage]);
    setInputMessage('');
    setIsChatting(true);

    try {
      const gptParams: AIChatInput = {
        history: currentHistory.map(m => ({ role: m.role, content: [{ text: m.content }] })),
        message: newMessage.content,
        model: user?.preferredModel,
        temperature: 0.7,
        existingSkills: {
          offered: user?.skillsOffered || [],
          wanted: user?.skillsWanted || [],
        },
        otherUsers: allUsers.map(u => ({
          offered: u.skillsOffered || [],
          wanted: u.skillsWanted || []
        }))
      };

      const response = await aiService.chat(gptParams);
      
      setMessages(prev => [...prev, { role: 'model', content: response.text }]);

      if (response.extractedSkills) {
        setSkills(response.extractedSkills);
        toast({
          title: 'Skills Detected!',
          description: 'Review your updated skills profile before continuing.',
        });
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveAndFindMatches = async () => {
    if (!skills || !user) return;
    setIsSaving(true);
    try {
      const updatedUser = await databaseService.updateUser(user.id, {
        skillsOffered: skills.offered,
        skillsWanted: skills.wanted,
      });
      if (updatedUser) {
        updateUserContext(updatedUser);
      }
      setSkills(null);
      toast({ title: 'Profile Updated', description: 'Taking you back home to see your matches...' });
      
      // Navigate to home to see matches
      router.push('/');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save skills. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Skill Matcher</h1>
          <p className="text-muted-foreground mt-1">Chat with our AI to find the perfect learning partner.</p>
        </div>
      </div>

      <Card className={`flex flex-col w-full shadow-sm border-muted h-[600px] transition-all duration-300`}>
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="text-primary w-5 h-5" />
            Skill Discovery Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
           <div 
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4"
           >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                     <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
           </div>
           
           <div className="mt-4 flex gap-2 pt-2">
              <Input
                placeholder="What skill are you looking to learn today? (e.g., Intro to Figma)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isChatting}
                className="flex-1 rounded-full px-4"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputMessage.trim() || isChatting}
                size="icon"
                className="rounded-full shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
           </div>
        </CardContent>
      </Card>

      {/* Skills Update Dialog */}
      <Dialog open={!!skills} onOpenChange={(open) => { if (!open) setSkills(null); }}>
        <DialogContent className="max-w-md w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {skills && (
            <>
              <DialogHeader>
                <DialogTitle>Update Your Skills</DialogTitle>
                <DialogDescription>Based on our chat, here's your updated profile. Save to find new matches!</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills you offer</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.offered.length > 0 ? (
                      skills.offered.map((skill) => (
                        <Badge key={skill} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No skills offered were detected.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills you want</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.wanted.length > 0 ? (
                      skills.wanted.map((skill) => (
                        <Badge variant="secondary" key={skill} className="bg-secondary/50">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No skills wanted were detected.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button 
                  onClick={handleSaveAndFindMatches} 
                  disabled={isSaving || (skills.offered.length === 0 && skills.wanted.length === 0)} 
                  className="w-full" 
                  size="lg"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile & View New Matches
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setSkills(null)}
                  disabled={isSaving}
                  className="w-full"
                >
                  Discard Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
