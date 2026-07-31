export type Platform = 'twitter' | 'facebook' | 'instagram' | 'linkedin';

export interface MediaAttachment {
  id: string;
  url: string; // Object URL for rendering previews
  type: 'image' | 'video';
  file: File;
}

export interface PostContent {
  unifiedText: string;
  customTexts: Record<Platform, string>;
  isCustomized: boolean; // True if user is tailoring content per platform
  media: MediaAttachment[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  field: 'text' | 'media' | 'hashtags';
}

export interface ValidationResult {
  platform: Platform;
  isValid: boolean;
  charCount: number;
  errors: ValidationError[];
}

export interface PlatformConfig {
  id: Platform;
  name: string;
  maxChars: number;
  warningChars: number;
  placeholder: string;
  color: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    maxChars: 280,
    warningChars: 240,
    placeholder: "What's happening? (Max 280 chars)",
    color: '#1DA1F2',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    maxChars: 5000, // Practical composer limit, Facebook actual is 63,206
    warningChars: 4800,
    placeholder: "What's on your mind? (Max 5,000 chars)",
    color: '#1877F2',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    maxChars: 2200,
    warningChars: 2000,
    placeholder: 'Write a caption... (Instagram requires at least 1 image/video)',
    color: '#E4405F',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    maxChars: 3000,
    warningChars: 2800,
    placeholder: 'What do you want to talk about? (Max 3,000 chars)',
    color: '#0A66C2',
  },
};
