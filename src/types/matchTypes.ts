import type { User } from './userTypes';

export type Match = {
  id: string;
  users: [User, User];
  matchedSkills: {
    aToB: string[]; // Skills user A can teach user B
    bToA: string[]; // Skills user B can teach user A
  };
  score: number;
  aiSummary: string;
  status: 'pending' | 'accepted' | 'declined';
};

export type Appointment = {
  id: string;
  matchId: string;
  users: [User, User];
  date: Date;
  meetLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};
