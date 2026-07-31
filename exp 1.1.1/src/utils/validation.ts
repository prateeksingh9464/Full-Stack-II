import type { Platform, PostContent, ValidationResult, ValidationError } from '../types';
import { PLATFORM_CONFIGS } from '../types';

export const countHashtags = (text: string): number => {
  const hashtags = text.match(/#[a-zA-Z0-9_\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/g);
  return hashtags ? hashtags.length : 0;
};

export const validatePostForPlatform = (
  platform: Platform,
  content: PostContent
): ValidationResult => {
  const text = content.isCustomized ? content.customTexts[platform] : content.unifiedText;
  const media = content.media;
  const config = PLATFORM_CONFIGS[platform];
  
  const errors: ValidationError[] = [];
  const charCount = text.length;

  // 1. Character limit validation
  if (charCount > config.maxChars) {
    errors.push({
      type: 'error',
      field: 'text',
      message: `Exceeds max character limit (${charCount}/${config.maxChars} chars).`,
    });
  } else if (charCount >= config.warningChars) {
    errors.push({
      type: 'warning',
      field: 'text',
      message: `Approaching character limit (${charCount}/${config.maxChars} chars).`,
    });
  }

  // 2. Platform-specific validation rules
  switch (platform) {
    case 'twitter': {
      const imageCount = media.filter(m => m.type === 'image').length;
      const videoCount = media.filter(m => m.type === 'video').length;

      if (videoCount > 1) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'Twitter / X supports a maximum of 1 video.',
        });
      }
      if (imageCount > 4) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'Twitter / X supports a maximum of 4 images.',
        });
      }
      if (videoCount > 0 && imageCount > 0) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'Twitter / X does not allow mixing images and videos in a single tweet.',
        });
      }
      break;
    }

    case 'instagram': {
      const hashtagCount = countHashtags(text);
      if (hashtagCount > 30) {
        errors.push({
          type: 'error',
          field: 'hashtags',
          message: `Instagram supports max 30 hashtags. You have ${hashtagCount}.`,
        });
      } else if (hashtagCount >= 25) {
        errors.push({
          type: 'warning',
          field: 'hashtags',
          message: `Approaching Instagram hashtag limit (${hashtagCount}/30).`,
        });
      }

      if (media.length === 0) {
        errors.push({
          type: 'warning',
          field: 'media',
          message: 'Instagram is a visual platform and requires at least 1 image or video.',
        });
      } else if (media.length > 10) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'Instagram carousel posts support a maximum of 10 media items.',
        });
      }
      break;
    }

    case 'linkedin': {
      if (media.length > 9) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'LinkedIn supports a maximum of 9 media attachments.',
        });
      }
      break;
    }

    case 'facebook': {
      if (media.length > 10) {
        errors.push({
          type: 'error',
          field: 'media',
          message: 'Facebook supports a maximum of 10 media attachments.',
        });
      }
      break;
    }
  }

  return {
    platform,
    isValid: !errors.some(e => e.type === 'error'),
    charCount,
    errors,
  };
};

export const validatePost = (
  content: PostContent
): Record<Platform, ValidationResult> => {
  const results = {} as Record<Platform, ValidationResult>;
  
  // Initialize all values first
  const platforms: Platform[] = ['twitter', 'facebook', 'instagram', 'linkedin'];
  platforms.forEach(p => {
    results[p] = validatePostForPlatform(p, content);
  });

  return results;
};
