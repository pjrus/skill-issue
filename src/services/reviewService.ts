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

export const reviewService = {
  /**
   * Creates a new review with a deterministic ID to prevent duplicates per booking.
   */
  createReview: async (data: CreateReviewData): Promise<string> => {
    const reviewId = `${data.bookingId}_${data.reviewerId}`;
    const reviewRef = doc(db, 'reviews', reviewId);
    
    // Check if review already exists (should be handled by firestore rules too)
    const existing = await getDoc(reviewRef);
    if (existing.exists()) {
      throw new Error('Review already exists for this booking.');
    }

    const review: Omit<Review, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
      bookingId: data.bookingId,
      reviewerId: data.reviewerId,
      revieweeId: data.revieweeId,
      reviewText: data.reviewText,
      createdAt: Timestamp.now(),
    };

    await setDoc(reviewRef, review);
    return reviewId;
  },

  /**
   * Fetches all reviews for a specific user (where they are the reviewee).
   */
  getReviewsForUser: async (userId: string): Promise<Review[]> => {
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
  },

  /**
   * Fetches all reviews given by a specific user.
   */
  getReviewsGivenByUser: async (userId: string): Promise<Review[]> => {
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
  }
};
