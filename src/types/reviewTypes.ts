export interface Review {
  id: string; // {bookingId}_{reviewerId}
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewText: string;
  rating: number; // 1-5
  createdAt: Date;
}

export interface CreateReviewData {
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewText: string;
  rating: number; // 1-5
}
