"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

export default function SkillsPage() {
  const router = useRouter();
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<{ offered: string[]; wanted: string[] } | null>(null);

  const handleSkillExtraction = async () => {
    if (!message) return;
    setIsLoading(true);
    setSkills(null);
    try {
      const result = await aiService.extractSkillsFromText({ description: message, model: user?.preferredModel });
      setSkills({
        offered: result.skillsOffered,
        wanted: result.skillsWanted,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to extract skills. Please try again.',
      });
    } finally {
      setIsLoading(false);
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
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="text-primary" />
              Tell us about your skills
            </CardTitle>
            <CardDescription>
              Describe what you can teach and what you want to learn. Our AI will do the rest.
              For example: "I need help learning React but I can teach Python and algorithms."
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Start typing here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSkillExtraction} disabled={isLoading || !message}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extract Skills
            </Button>
          </CardContent>
          {skills && (
            <CardFooter className="flex-col items-start gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Skills you offer:</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.offered.length > 0 ? (
                    skills.offered.map((skill) => <Badge key={skill}>{skill}</Badge>)
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills offered were detected.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Skills you want:</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.wanted.length > 0 ? (
                    skills.wanted.map((skill) => (
                      <Badge variant="secondary" key={skill}>
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills wanted were detected.</p>
                  )}
                </div>
              </div>
              <Button onClick={handleSaveAndFindMatches} disabled={isSaving} size="lg">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Find Matches
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
