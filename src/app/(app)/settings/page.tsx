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
import { matchingService } from '@/services/matchingService';
import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Eye, EyeOff, Camera, User as UserIcon, Star } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { reviewService } from '@/services/reviewService';
import type { Review } from '@/types/reviewTypes';
import { cache, CACHE_TTL } from '@/lib/cache';

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
    const [profileDescription, setProfileDescription] = useState('');
    const [fullName, setFullName] = useState('');

    const [avatarUrl, setAvatarUrl] = useState('');
    const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
    const [skillsWanted, setSkillsWanted] = useState<string[]>([]);
    const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
    const [preferredModel, setPreferredModel] = useState<string>('googleai/gemini-1.5-flash');
    const [geminiApiKey, setGeminiApiKey] = useState<string>('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const models = await cache.swr('gemini_models', async () => {
                    const res = await fetch('/api/models');
                    if (!res.ok) throw new Error("Failed to fetch models");
                    const data = await res.json();
                    return data.models || [];
                }, CACHE_TTL.MODELS);
                setAvailableModels(models);
            } catch (error) {
                console.error("Failed to fetch models", error);
            }
        };
        fetchModels();
    }, []);

    useEffect(() => {
        if (user) {
            setBio(user.bio || '');
            setProfileDescription(user.profileDescription || '');
            setFullName(user.fullName || '');

            setAvatarUrl(user.avatarUrl || '');
            setSkillsOffered(user.skillsOffered || []);
            setSkillsWanted(user.skillsWanted || []);
            setLearningStyles(user.learningStyle || []);
            if (user.preferredModel) {
                setPreferredModel(user.preferredModel);
            }
            // Load API key from localStorage (never stored in Firestore)
            const storedKey = localStorage.getItem('geminiApiKey') || '';
            setGeminiApiKey(storedKey);

            // Fetch reviews
            const fetchReviews = async () => {
                try {
                    const data = await reviewService.getReviewsForUser(user.id);
                    setReviews(data);
                } catch (error) {
                    console.error("Failed to fetch reviews", error);
                } finally {
                    setIsLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [user]);

    const handleStyleToggle = (style: LearningStyle) => {
        if(learningStyles.includes(style)) {
            setLearningStyles(styles => styles.filter(s => s !== style));
        } else {
            setLearningStyles(styles => [...styles, style]);
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an image file.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Error', description: 'File size must be less than 5MB.' });
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `users/${user.id}/profile_picture/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            setAvatarUrl(downloadUrl);
            toast({ title: 'Success', description: 'Avatar uploaded. Click Save to persist changes.' });
        } catch (error) {
            console.error("Upload error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Save API key to localStorage only (never sent to Firestore)
            if (geminiApiKey.trim()) {
                localStorage.setItem('geminiApiKey', geminiApiKey.trim());
            } else {
                localStorage.removeItem('geminiApiKey');
            }

            const updatedData = {
                bio,
                profileDescription,
                fullName,
                avatarUrl,

                skillsOffered,
                skillsWanted,
                learningStyle: learningStyles,
                preferredModel,
            }
            const updatedUser = await databaseService.updateUser(user.id, updatedData);
            if(updatedUser) {
                updateUserContext(updatedUser);
                await matchingService.refreshMatches(user.id);
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
        <div className="container py-10 max-w-3xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your profile and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-primary/10">
                                <AvatarImage src={avatarUrl} alt={fullName} />
                                <AvatarFallback className="bg-primary/5">
                                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleAvatarUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Click the camera icon to update your profile photo.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Your Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profileDescription">Profile Description</Label>
                        <Textarea id="profileDescription" value={profileDescription} onChange={(e) => setProfileDescription(e.target.value)} placeholder="Describe what you can offer and what you are looking for..." rows={4} />
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

                    <div className="grid gap-2">
                        <Label htmlFor="apiKey">Gemini API Key Override</Label>
                        <p className="text-xs text-muted-foreground">
                            Provide your own <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> key to use instead of the platform default. Leave blank to use the shared key.
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="apiKey"
                                    type={showApiKey ? 'text' : 'password'}
                                    value={geminiApiKey}
                                    onChange={(e) => setGeminiApiKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="pr-10 font-mono text-sm"
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {geminiApiKey && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={() => setGeminiApiKey('')}
                                    title="Clear API key"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Reviews Received</CardTitle>
                    <CardDescription>What others are saying about your skills.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingReviews ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                            No reviews received yet. Complete some bookings to get feedback!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium italic">"{review.reviewText}"</p>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star 
                                                    key={s} 
                                                    className={`h-3 w-3 ${
                                                        s <= review.rating 
                                                            ? "fill-yellow-400 text-yellow-400" 
                                                            : "text-muted-foreground/20"
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">
                                        Received on {review.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
