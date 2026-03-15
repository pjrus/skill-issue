export const FALLBACK_DESCRIPTIONS = [
  "I'm passionate about sharing my skills and learning from others!",
  "Always looking for new challenges and collaborative learning opportunities.",
  "Skill swapping is the future! Happy to teach what I know.",
  "Eager to broaden my horizons and contribute to the community.",
  "Knowledge is better when shared. Let's swap skills!",
  "I love the idea of mutual growth through skill exchange."
];

export function getSampleDescription(userId: string) {
  // Use userId to consistently pick a description for the same user
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_DESCRIPTIONS[hash % FALLBACK_DESCRIPTIONS.length];
}
