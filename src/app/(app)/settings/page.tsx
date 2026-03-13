"use client";

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { allLearningStyles, type LearningStyle } from '@/types/userTypes';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/services/databaseService';
import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

function SkillsInput({ title, skills, setSkills }: { title: string; skills: string[]; setSkills: (skills: string[]) => void; }) {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            if (!skills.find(s => s.toLowerCase() === currentSkill.trim().toLowerCase())) {
                setSkills([...skills, currentSkill.trim()]);
            }
            setCurrentSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    return (
        <div className="grid gap-2">
            <Label>{title}</Label>
            <Input
                placeholder="Type a skill and press Enter"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={handleAddSkill}
            />
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md border bg-transparent">
                {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} className="rounded-full hover:bg-muted-foreground/20">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const { user, updateUserContext } = useUser();
    const { toast } = useToast();
    const [bio, setBio] = useState('');
    const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
    const [skillsWanted, setSkillsWanted] = useState<string[]>([]);
    const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setBio(user.bio);
            setSkillsOffered(user.skillsOffered);
            setSkillsWanted(user.skillsWanted);
            setLearningStyles(user.learningStyle);
        }
    }, [user]);

    const handleStyleToggle = (style: LearningStyle) => {
        if(learningStyles.includes(style)) {
            setLearningStyles(styles => styles.filter(s => s !== style));
        } else {
            setLearningStyles(styles => [...styles, style]);
        }
    }

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const updatedData = {
                bio,
                skillsOffered,
                skillsWanted,
                learningStyle: learningStyles,
            }
            const updatedUser = await databaseService.updateUser(user.id, updatedData);
            if(updatedUser) {
                updateUserContext(updatedUser);
                toast({ title: 'Success', description: 'Your profile has been updated.' });
            } else {
                throw new Error("User not found after update");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if(!user) return null;

    return (
        <div className="container py-10 max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your profile and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Your Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
                    </div>

                    <SkillsInput title="Skills You Offer" skills={skillsOffered} setSkills={setSkillsOffered} />
                    <SkillsInput title="Skills You Want to Learn" skills={skillsWanted} setSkills={setSkillsWanted} />

                     <div className="grid gap-2">
                        <Label>Preferred Learning Styles</Label>
                         <div className="flex flex-wrap gap-2">
                            {allLearningStyles.map(style => (
                                <Button
                                    key={style}
                                    variant={learningStyles.includes(style) ? "default" : "outline"}
                                    onClick={() => handleStyleToggle(style)}
                                    size="sm"
                                >
                                    {style}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
