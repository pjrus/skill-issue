export type LearningStyle =
  | 'Hands-on'
  | 'Concept-first'
  | 'Visual'
  | 'Discussion-based'
  | 'Fast-paced'
  | 'Step-by-step';

export const allLearningStyles: LearningStyle[] = [
  'Hands-on',
  'Concept-first',
  'Visual',
  'Discussion-based',
  'Fast-paced',
  'Step-by-step',
];

export type User = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password?: string; // Should not be sent to client
  avatarUrl: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  learningStyle: LearningStyle[];
  availability: string;
  preferredModel?: string;
};
