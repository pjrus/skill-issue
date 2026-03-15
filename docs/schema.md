  # Skill-Issue Schema and Security Rules

This document outlines the data schema for the Skill-Issue application and the corresponding Firestore Security Rules to protect user data.

For code-level architecture and Firebase wiring details (providers, auth flow, service/hook layers), see `docs/architecture.md`.

## Data Models

The application uses two main data models: `User` and `Appointment`.

### User

Represents a user's profile in the application.

- **Collection Path:** `/users/{userId}`
- **Schema:**
  - `username` (string): The user's public display name.
  - `fullName` (string): The user's full name.
  - `email` (string): The user's email address (must be a valid email format).
  - `avatarUrl` (string): A URL to the user's profile picture (stored in Firebase Storage).
  - `bio` (string): A short user biography.
  - `skillsOffered` (list of strings): Skills the user can teach.
  - `skillsWanted` (list of strings): Skills the user wants to learn.
  - `learningStyle` (list of strings): The user's preferred learning methods.
  - `availability` (string): User's general availability.

### Appointment

Represents a scheduled meeting between two users.

- **Collection Path:** `/appointments/{appointmentId}`
- **Schema:**
  - `matchId` (string): An identifier for the match that led to this appointment.
  - `userIds` (list of strings): A list containing the two `userId`s of the participants.
  - `date` (timestamp): The scheduled date and time of the appointment.
  - `meetLink` (string, optional): The URL for the video call.
  - `status` (string): The status of the appointment (`scheduled`, `completed`, `cancelled`).
  - `teachingSkill` (string): The specific skill the initiator is teaching.
  - `learningSkill` (string): The specific skill the initiator is learning.

### Review

Represents a text review left by one participant for another after a booking.

- **Collection Path:** `/reviews/{bookingId}_{reviewerId}`
- **Schema:**
  - `id` (string): The document ID, following the format `{bookingId}_{reviewerId}` to ensure uniqueness.
  - `bookingId` (string): ID of the corresponding appointment.
  - `reviewerId` (string): UID of the user leaving the review.
  - `revieweeId` (string): UID of the user being reviewed.
  - `reviewText` (string): The content of the review.
  - `createdAt` (timestamp): When the review was submitted.

## Firestore Security Rules

The security rules are designed to enforce the following principles:

1.  **Ownership:** Users have full control over their own data.
2.  **Read Access for Matching:** Authenticated users can read public portions of other user profiles to facilitate skill matching.
3.  **Appointment Privacy:** Appointment details are only visible to the participants.
4.  **Review Integrity:** Reviews are immutable once created. Only participants involved in a booking can review each other.
5.  **Data Integrity:** All data written to the database must conform to the defined schema.

### Rules Breakdown

#### `/users/{userId}`

-   **`get`, `list`**: Any authenticated user can read user profiles. This is necessary for the matching algorithm to find potential partners for the current user.
-   **`create`**: A user can only create their own profile document (`userId` must match the authenticated user's UID). The data being written must be a valid `User` object, ensuring all required fields and types are correct from the start.
-   **`update`**: A user can only update their own profile. We prevent critical fields like `email` from being changed after creation to maintain account integrity. All updated data is validated against the schema.

#### `/appointments/{appointmentId}`

-   **`get`**: Only users whose `userId` is in the `userIds` list for an appointment can read its details.
-   **`create`**: An appointment can only be created by one of the participants. The data must be a valid `Appointment` object.
-   **`update`**: An appointment can only be updated by one of the participants. The updated data must also be valid.

#### `/reviews/{reviewId}`

-   **`get`, `list`**: Any authenticated user can read reviews.
-   **`create`**: A user can only create a review if they were a participant in the referenced booking, the reviewee was also a participant, and they are not reviewing themselves. Document ID must match `{bookingId}_{reviewerId}` to prevent duplicates.
-   **`update`, `delete`**: Denied. Reviews are immutable.
