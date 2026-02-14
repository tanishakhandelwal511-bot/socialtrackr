
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum Platform {
  INSTAGRAM = 'Instagram',
  LINKEDIN = 'LinkedIn',
  YOUTUBE = 'YouTube',
  X = 'X (Twitter)',
  THREADS = 'Threads',
  PINTEREST = 'Pinterest',
  TIKTOK = 'TikTok',
  FACEBOOK = 'Facebook'
}

export enum Goal {
  FOLLOWERS = 'Grow Followers',
  AUTHORITY = 'Build Authority',
  CLIENTS = 'Get Clients'
}

export enum ExperienceLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface ContentDay {
  day: number;
  format: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  tip: string;
  completed: boolean;
  script?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  onboarded: boolean;
  platform?: Platform;
  niche?: string;
  goal?: Goal;
  level?: ExperienceLevel;
  calendar: ContentDay[];
  currentStreak: number;
  longestStreak: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
