# Review System Documentation

The Skill-Issue Review System allows users to leave peer-to-peer feedback after a skill swap session (booking) is completed. This document outlines the technical architecture, data flow, and security model of the system.

## Overview

- **Purpose**: To build trust and provide transparency within the skill-sharing community.
- **Scope**: Text reviews with a 1-5 star numerical rating.
- **Participation**: Reviews can only be left for bookings with a `completed` status.

## Data Model

### Firestore Structure

Reviews are stored in a top-level `reviews` collection.

- **Collection Path**: `/reviews/{reviewId}`
- **Review ID Format**: `${bookingId}_${reviewerId}`

### Schema (TypeScript: `Review` in `reviewTypes.ts`)

```typescript
export interface Review {
  id: string;           // {bookingId}_{reviewerId}
  bookingId: string;    // Reference to the appointment
  reviewerId: string;   // UID of the sender
  revieweeId: string;   // UID of the recipient
  reviewText: string;   // The feedback content
  rating: number;       // 1-5 numerical rating
  createdAt: Date;      // Submission timestamp
}
```

## Security Model (`firestore.rules`)

The system follows a strict security policy:
1.  **Read Access**: All authenticated users can read reviews.
2.  **Create Access**:
    - User must be authenticated and match the `reviewerId`.
    - User cannot review themselves (`reviewerId != revieweeId`).
    - **Participation Check**: Both `reviewerId` and `revieweeId` must exist in the `userIds` list of the corresponding `appointment`.
    - **ID Validation**: The document ID must strictly match the `${bookingId}_${reviewerId}` pattern.
3.  **Immutability**: `update` and `delete` operations are explicitly denied.

## Services (`reviewService.ts`)

- `createReview(data)`: Adds a new review to Firestore. Generates the deterministic ID.
- `getReviewsForUser(userId)`: Fetches all reviews where the user is the `reviewee`.
- `getReviewsGivenByUser(userId)`: Fetches all reviews where the user is the `reviewer`.

## UI Integration

### 1. `BookingsPage` (`src/app/(app)/bookings/page.tsx`)
- Displays a "Leave Review" button for bookings with `status: 'completed'`.
- Uses `ReviewModal.tsx` for input.
- Displays a "Review Submitted" badge if the user has already left a review for that booking.

### 2. `HomePage` (`src/app/(app)/page.tsx`)
- Integrated `UserReviewSnippet` into user cards.
- Displays the total review count and a snippet of the most recent review.

### 3. `SettingsPage` (`src/app/(app)/settings/page.tsx`)
- Added a "Reviews Received" section.
- Lists all reviews received by the logged-in user with timestamps and star ratings.

### 4. `UserProfilePage` (`src/app/(app)/user/[userId]/page.tsx`)
- New public/private profile view for any user.
- Displays calculated average rating.
- Lists all reviews received by that specific user.

## Indexing Requirements

Firestore requires a composite index to efficiently fetch and order reviews by user. 

If you encounter an "Index Required" error in the console or logs, ensure the following index is created:

- **Collection**: `reviews`
- **Fields**: 
    - `revieweeId`: `ASCENDING`
    - `createdAt`: `DESCENDING`

You can create this manually in the [Firebase Console](https://console.firebase.google.com/project/_/firestore/indexes).

## Implementation Details
...
