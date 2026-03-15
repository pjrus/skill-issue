'use client';

import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import type { Review, CreateReviewData } from '@/types/reviewTypes';
import { cache, CACHE_TTL } from '@/lib/cache';

export const reviewService = {
  /**
   * Creates a new review with a deterministic ID to prevent duplicates per booking.
   */
  createReview: async (data: CreateReviewData): Promise<string> => {
    // Deterministic ID Strategy:
    // We use `${bookingId}_${reviewerId}` to ensure that a user can only leave ONE 
    // review per booking. Even if they hit the save button multiple times, 
    // it will resolve to the same Firestore document.
    const reviewId = `${data.bookingId}_${data.reviewerId}`;
    const reviewRef = doc(db, 'reviews', reviewId);
    
    // Check if review already exists to provide a friendly UI error message,
    // although Firestore rules should also catch this as a backup.
    const existing = await getDoc(reviewRef);
    if (existing.exists()) {
      throw new Error('Review already exists for this booking.');
    }

    const review: Omit<Review, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
      bookingId: data.bookingId,
      reviewerId: data.reviewerId,
      revieweeId: data.revieweeId,
      reviewText: data.reviewText,
      rating: data.rating,
      createdAt: Timestamp.now(),
    };

    await setDoc(reviewRef, review);

    // Invalidate caches for both reviewer and reviewee
    cache.invalidate(`reviews_for_${data.revieweeId}`);
    cache.invalidate(`reviews_by_${data.reviewerId}`);

    return reviewId;
  },

  /**
   * Fetches all reviews for a specific user (where they are the reviewee).
   */
  getReviewsForUser: async (userId: string): Promise<Review[]> => {
    return cache.swr(`reviews_for_${userId}`, async () => {
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef, 
        where('revieweeId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as Review;
      });
    }, CACHE_TTL.REVIEWS);
  },

  /**
   * Fetches all reviews given by a specific user.
   */
  getReviewsGivenByUser: async (userId: string): Promise<Review[]> => {
    return cache.swr(`reviews_by_${userId}`, async () => {
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef, 
        where('reviewerId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as Review;
      });
    }, CACHE_TTL.REVIEWS);
  }
};
