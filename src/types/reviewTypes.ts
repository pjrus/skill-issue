export interface Review {
  id: string; // {bookingId}_{reviewerId}
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewText: string;
  createdAt: Date;
}

export interface CreateReviewData {
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewText: string;
}
