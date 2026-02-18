import { Platform, Goal, ExperienceLevel } from './types';

export const ADMIN_EMAIL = 'admin@socialtrackr.com';
export const ADMIN_PASSWORD = 'admin123';

export const PLATFORMS = Object.values(Platform);
export const GOALS = Object.values(Goal);
export const LEVELS = Object.values(ExperienceLevel);

export const CONTENT_FORMATS = [
  'Reel', 'Carousel', 'Post', 'Story', 'Thread', 'Video', 'Short', 'Tweet', 'Pin'
];

export const SUGGESTED_PROMPTS = [
  "Make this caption more engaging",
  "Give me a better hook",
  "Summarize this for a thread",
  "Generate viral hashtags",
  "Write a script for this Reel"
];