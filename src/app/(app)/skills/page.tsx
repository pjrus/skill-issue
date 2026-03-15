"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Save } from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import { matchingService } from '@/services/matchingService';
import { useToast } from '@/hooks/use-toast';

export default function SkillsPage() {
  const router = useRouter();
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();

  const [offered, setOffered] = useState<string[]>([]);
  const [wanted, setWanted] = useState<string[]>([]);
  const [newOffered, setNewOffered] = useState('');
  const [newWanted, setNewWanted] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setOffered(user.skillsOffered || []);
      setWanted(user.skillsWanted || []);
    }
  }, [user]);

  const handleAddOffered = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffered.trim()) return;
    if (!offered.includes(newOffered.trim())) {
      setOffered([...offered, newOffered.trim()]);
    }
    setNewOffered('');
  };

  const handleAddWanted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWanted.trim()) return;
    if (!wanted.includes(newWanted.trim())) {
      setWanted([...wanted, newWanted.trim()]);
    }
    setNewWanted('');
  };

  const handleRemoveOffered = (skill: string) => {
    setOffered(offered.filter(s => s !== skill));
  };

  const handleRemoveWanted = (skill: string) => {
    setWanted(wanted.filter(s => s !== skill));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser = await databaseService.updateUser(user.id, {
        skillsOffered: offered,
        skillsWanted: wanted,
      });
      if (updatedUser) {
        updateUserContext(updatedUser);
        await matchingService.refreshMatches(user.id);
      }
      toast({
        title: 'Profile Saved',
        description: 'Your skills have been updated successfully.',
      });
    } catch (error: any) {
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
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
        <p className="text-muted-foreground mt-2">
          Manage the skills you can share and the ones you want to learn to get better matches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Skills Offered */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Skills I Can Teach</CardTitle>
            <CardDescription>What are you good at? Add skills you're comfortable mentoring others in.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <form onSubmit={handleAddOffered} className="flex gap-2">
              <Input 
                placeholder="e.g. React.js, Piano, UX Design" 
                value={newOffered} 
                onChange={e => setNewOffered(e.target.value)} 
              />
              <Button type="submit" size="icon" variant="secondary" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {offered.length > 0 ? (
                offered.map((skill) => (
                  <Badge 
                    key={skill} 
                    className="pl-3 pr-1 py-1 flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                  >
                    {skill}
                    <button 
                      onClick={() => handleRemoveOffered(skill)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {skill}</span>
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic w-full">No skills added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills Wanted */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Skills I Want To Learn</CardTitle>
            <CardDescription>What do you want to master next? Add skills to find your match.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <form onSubmit={handleAddWanted} className="flex gap-2">
              <Input 
                placeholder="e.g. Spanish, Data Science, Knitting" 
                value={newWanted} 
                onChange={e => setNewWanted(e.target.value)} 
              />
              <Button type="submit" size="icon" variant="secondary" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {wanted.length > 0 ? (
                wanted.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary"
                    className="pl-3 pr-1 py-1 flex items-center gap-1"
                  >
                    {skill}
                    <button 
                      onClick={() => handleRemoveWanted(skill)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {skill}</span>
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic w-full">No skills added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveChanges} disabled={isSaving} size="lg" className="w-full sm:w-auto">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

    </div>
  );
}
