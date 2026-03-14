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
                autoComplete="off"
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
    const [preferredModel, setPreferredModel] = useState<string>('googleai/gemini-1.5-flash');
    const [isLoading, setIsLoading] = useState(false);
    const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (res.ok) {
                    const data = await res.json();
                    if (data.models) {
                        setAvailableModels(data.models);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch models", error);
            }
        };
        fetchModels();
    }, []);

    useEffect(() => {
        if (user) {
            setBio(user.bio);
            setSkillsOffered(user.skillsOffered);
            setSkillsWanted(user.skillsWanted);
            setLearningStyles(user.learningStyle);
            if (user.preferredModel) {
                setPreferredModel(user.preferredModel);
            }
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
                preferredModel,
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

                    <div className="grid gap-2">
                        <Label htmlFor="model">Preferred AI Model (requires refresh to fully apply)</Label>
                        <select
                            id="model"
                            value={preferredModel}
                            onChange={(e) => setPreferredModel(e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {availableModels.length > 0 ? (
                                availableModels.map((model) => (
                                    <option key={model.id} value={`googleai/${model.id}`}>
                                        {model.name}
                                    </option>
                                ))
                            ) : (
                                <option value="googleai/gemini-1.5-flash">Gemini 1.5 Flash</option>
                            )}
                        </select>
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
