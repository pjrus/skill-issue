"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { databaseService } from "@/services/databaseService";
import { reviewService } from "@/services/reviewService";
import { User } from "@/types/userTypes";
import { Review } from "@/types/reviewTypes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, Calendar, MessageSquare, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { getSampleDescription } from "@/lib/userUtils";

export default function UserProfilePage() {
  const { userId } = useParams() as { userId: string };
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [userData, userReviews] = await Promise.all([
          databaseService.getUser(userId),
          reviewService.getReviewsForUser(userId)
        ]);
        setProfileUser(userData);
        setReviews(userReviews);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="container py-10 space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <Button variant="link" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length 
    : null;

  return (
    <div className="container py-10 space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-muted/20">
            <CardHeader className="text-center pb-2">
              <Avatar className="h-32 w-32 mx-auto border-4 border-background shadow-lg">
                <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} />
                <AvatarFallback className="text-4xl">{profileUser.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="mt-4 space-y-1">
                <CardTitle className="text-2xl">{profileUser.username}</CardTitle>
                <CardDescription>Skill-Issue Community Member</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {averageRating !== null && (
                <div className="flex flex-col items-center p-4 bg-muted/40 rounded-2xl border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${
                          star <= Math.round(averageRating) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground/30"
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                    from {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Skills Teaching
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.skillsOffered?.map(skill => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-secondary-foreground" />
                    Skills Learning
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.skillsWanted?.map(skill => (
                      <Badge key={skill} variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button className="w-full shadow-md" onClick={() => router.push(`/ai-chat`)}>
                Connect with {profileUser.username}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: About & Reviews */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Description Card */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                About {profileUser.username}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed italic text-foreground/90">
                "{profileUser.profileDescription || getSampleDescription(profileUser.id)}"
              </p>
            </CardContent>
          </Card>

          {/* Reviews Card */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  Reviews Received
                </CardTitle>
                <CardDescription>What others are saying about their sessions</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {reviews.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                  <p className="text-muted-foreground italic">No reviews yet. Be the first to swap skills and leave a review!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="group relative p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-4 w-4 ${
                                s <= review.rating 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-muted-foreground/20"
                              }`} 
                            />
                          ))}
                          <span className="ml-2 text-xs text-muted-foreground font-medium">
                            {format(review.createdAt, 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed relative z-10">
                        <span className="text-2xl leading-none text-primary/20 absolute -top-1 -left-4 font-serif">"</span>
                        {review.reviewText}
                        <span className="text-2xl leading-none text-primary/20 absolute -bottom-4 font-serif ml-1">"</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
