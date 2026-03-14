"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Wand2, CheckCircle2 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { AIChatInput } from '@/ai/flows/ai-skills-chat';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ChatMessage = {
  role: 'user' | 'model' | 'system';
  content: string;
};

export default function SkillsPage() {
  const router = useRouter();
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<{ offered: string[]; wanted: string[] } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && !isChatting) {
      const offered = user?.skillsOffered?.length ? user.skillsOffered.join(', ') : '';
      const wanted = user?.skillsWanted?.length ? user.skillsWanted.join(', ') : '';
      
      let initialMessage = "Hi! I'm here to help you get started. Could you tell me a little bit about what skills you have to offer, and what you'd like to learn?";
      
      if (offered || wanted) {
        initialMessage = `Hi! I see you have some skills set up already.\n\n`;
        if (offered) initialMessage += `You offer: ${offered}\n`;
        if (wanted) initialMessage += `You want: ${wanted}\n`;
        initialMessage += `\nDo you want to add or change any of these, or are you ready to find matches?`;
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
        temperature: 0.7, // Adjust temperature as needed
        existingSkills: {
          offered: user?.skillsOffered || [],
          wanted: user?.skillsWanted || [],
        }
      };

      const response = await aiService.chat(gptParams);
      
      setMessages(prev => [...prev, { role: 'model', content: response.text }]);

      if (response.extractedSkills) {
        setSkills(response.extractedSkills);
        toast({
          title: 'Skills Extracted!',
          description: 'Review your skills and save them if they look good.',
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
      router.push('/processing');
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
    <div className="container-fluid py-6 w-full h-[calc(100vh-80px)] flex flex-col items-center px-4 md:px-8">
      <div className="flex-1 w-full max-w-4xl min-h-0">
        
        {/* Chat Section */}
        <Card className="flex flex-col h-full w-full">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Wand2 className="text-primary w-5 h-5" />
              Chat about your skills
            </CardTitle>
            <CardDescription>
              Tell our AI assistant what you can teach and what you want to learn.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden flex flex-col p-4 pt-0">
             <div 
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto space-y-4 pr-4 pb-4"
             >
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg rounded-tl-none px-4 py-2">
                       <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
             </div>
             
             <div className="mt-auto flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isChatting}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim() || isChatting}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!skills} onOpenChange={(open) => { if (!open) setSkills(null); }}>
        <DialogContent className="max-w-md w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {skills && (
            <>
              <DialogHeader>
                <DialogTitle>Your Profile</DialogTitle>
                <DialogDescription>We'll use this to find your best matches.</DialogDescription>
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
                  Save Profile & Find Matches
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSkills(null)}
                  disabled={isSaving}
                  className="w-full"
                >
                  Continue Chatting
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
