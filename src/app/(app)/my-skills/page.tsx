"use client";

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, ListChecks } from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

export default function MySkillsPage() {
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  
  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newWantedSkill, setNewWantedSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleAddSkill = async (type: 'offered' | 'wanted') => {
    const inputSkill = type === 'offered' ? newOfferedSkill.trim() : newWantedSkill.trim();
    if (!inputSkill) return;

    const currentSkills = type === 'offered' ? [...user.skillsOffered] : [...user.skillsWanted];
    if (currentSkills.includes(inputSkill)) return;

    const updatedSkills = [...currentSkills, inputSkill];
    const updateData = type === 'offered' ? { skillsOffered: updatedSkills } : { skillsWanted: updatedSkills };

    setIsSaving(true);
    try {
      const updatedUser = await databaseService.updateUser(user.id, updateData);
      if (updatedUser) updateUserContext(updatedUser);
      if (type === 'offered') setNewOfferedSkill(''); else setNewWantedSkill('');
      
      toast({
        title: "Skill Added",
        description: `${inputSkill} was added to your profile.`,
      });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to add skill.' });
    } finally {
       setIsSaving(false);
    }
  };

  const handleRemoveSkill = async (type: 'offered' | 'wanted', skillToRemove: string) => {
    const currentSkills = type === 'offered' ? [...user.skillsOffered] : [...user.skillsWanted];
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove);
    const updateData = type === 'offered' ? { skillsOffered: updatedSkills } : { skillsWanted: updatedSkills };

    setIsSaving(true);
    try {
      const updatedUser = await databaseService.updateUser(user.id, updateData);
      if (updatedUser) updateUserContext(updatedUser);
      
      toast({
        title: "Skill Removed",
        description: `${skillToRemove} was removed from your profile.`,
      });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove skill.' });
    } finally {
       setIsSaving(false);
    }
  };

  return (
    <div className="container py-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
             <ListChecks className="h-8 w-8 text-primary" />
             My Skills Portfolio
          </h1>
          <p className="text-muted-foreground mt-2">Curate the specific skills you offer and want to learn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Skills to Teach</CardTitle>
            <CardDescription>What you are offering to others.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-2">
               <Input 
                 placeholder="Add a new skill" 
                 value={newOfferedSkill} 
                 onChange={(e) => setNewOfferedSkill(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && handleAddSkill('offered')}
                 disabled={isSaving}
               />
               <Button size="icon" variant="secondary" onClick={() => handleAddSkill('offered')} disabled={isSaving || !newOfferedSkill.trim()}>
                 <Plus className="h-4 w-4" />
                 <span className="sr-only">Add</span>
               </Button>
             </div>
             <div className="min-h-[120px] border rounded-md p-4 bg-muted/20 relative">
                 {isSaving && <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px] rounded-md z-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                 {user.skillsOffered.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No skills offered yet.</p>
                 ) : (
                    <div className="flex flex-wrap gap-2">
                       {user.skillsOffered.map(skill => (
                          <Badge key={skill} variant="default" className="flex items-center gap-1.5 group cursor-default">
                             {skill}
                             <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 hover:text-destructive transition-all" onClick={() => handleRemoveSkill('offered', skill)} />
                          </Badge>
                       ))}
                    </div>
                 )}
             </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Skills to Learn</CardTitle>
            <CardDescription>What you are looking for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-2">
               <Input 
                 placeholder="Add a new skill" 
                 value={newWantedSkill} 
                 onChange={(e) => setNewWantedSkill(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && handleAddSkill('wanted')}
                 disabled={isSaving}
               />
               <Button size="icon" variant="secondary" onClick={() => handleAddSkill('wanted')} disabled={isSaving || !newWantedSkill.trim()}>
                 <Plus className="h-4 w-4" />
                 <span className="sr-only">Add</span>
               </Button>
             </div>
             <div className="min-h-[120px] border rounded-md p-4 bg-muted/20 relative">
                 {isSaving && <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px] rounded-md z-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                 {user.skillsWanted.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No skills wanted yet.</p>
                 ) : (
                    <div className="flex flex-wrap gap-2">
                       {user.skillsWanted.map(skill => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1.5 group cursor-default">
                             {skill}
                             <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 hover:text-destructive transition-all" onClick={() => handleRemoveSkill('wanted', skill)} />
                          </Badge>
                       ))}
                    </div>
                 )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
