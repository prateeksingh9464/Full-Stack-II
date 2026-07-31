import React from 'react';
import type { Platform } from '../types';
import { PLATFORM_CONFIGS } from '../types';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onTogglePlatform: (platform: Platform) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onTogglePlatform,
}) => {
  const getIcon = (platform: Platform) => {
    switch (platform) {
      case 'twitter':
        return (
          <svg className="platform-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="platform-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="platform-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="platform-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        );
    }
  };

  const platforms: Platform[] = ['twitter', 'facebook', 'instagram', 'linkedin'];

  return (
    <div className="platform-grid">
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIGS[platform];
        const isActive = selectedPlatforms.includes(platform);
        
        return (
          <button
            key={platform}
            type="button"
            className={`platform-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTogglePlatform(platform)}
            style={{
              ['--accent-color' as any]: config.color,
              color: isActive ? config.color : 'var(--text-secondary)',
            }}
            title={`Toggle ${config.name}`}
          >
            {getIcon(platform)}
            <span>{config.name}</span>
          </button>
        );
      })}
    </div>
  );
};
