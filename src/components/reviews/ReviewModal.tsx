'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { reviewService } from '@/services/reviewService';
import { Loader2, Star } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  reviewerId,
  revieweeId,
  revieweeName,
  onSuccess
}: ReviewModalProps) {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Review',
        description: 'Please write something before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.createReview({
        bookingId,
        reviewerId,
        revieweeId,
        reviewText: reviewText.trim(),
        rating,
      });
      
      toast({
        title: 'Review Submitted',
        description: `Your feedback for ${revieweeName} has been saved.`,
      });
      
      setReviewText('');
      setRating(0);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            How was your session with {revieweeName}? Share your thoughts to help others in the community.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3 items-center justify-center">
            <Label className="text-center">How would you rate the experience?</Label>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-center text-muted-foreground font-medium">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Excellent!"}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review">Your Feedback</Label>
            <Textarea
              id="review"
              placeholder="E.g. Great teacher, very patient and explains concepts clearly!"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="h-32"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
