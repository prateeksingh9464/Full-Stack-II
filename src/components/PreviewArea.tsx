import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, Repeat2, Bookmark, Eye, 
  ThumbsUp, Send, MoreHorizontal, Globe, LayoutGrid, Globe2
} from 'lucide-react';
import type { Platform, PostContent } from '../types';

interface PreviewAreaProps {
  selectedPlatforms: Platform[];
  content: PostContent;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  selectedPlatforms,
  content,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<Platform | 'all'>('all');
  const [instagramMediaIndex, setInstagramMediaIndex] = useState(0);

  // Set active tab to first selected if the current active tab is not selected
  React.useEffect(() => {
    if (activePreviewTab !== 'all' && !selectedPlatforms.includes(activePreviewTab as Platform)) {
      if (selectedPlatforms.length > 0) {
        setActivePreviewTab(selectedPlatforms[0]);
      } else {
        setActivePreviewTab('all');
      }
    }
  }, [selectedPlatforms, activePreviewTab]);

  const getTextForPlatform = (platform: Platform) => {
    return content.isCustomized ? content.customTexts[platform] : content.unifiedText;
  };

  // Helper to format text with active links for hashtags, mentions, and URLs
  const formatFeedText = (text: string) => {
    if (!text) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Post content preview...</span>;
    
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        return <span key={index} className="feed-highlight">{part}</span>;
      }
      if (part.startsWith('@') && part.length > 1) {
        return <span key={index} className="feed-highlight">{part}</span>;
      }
      if (part.match(/^(https?:\/\/|www\.)\S+/i)) {
        return <span key={index} className="feed-highlight" style={{ textDecoration: 'underline' }}>{part}</span>;
      }
      return part;
    });
  };

  const renderMediaGrid = (platform: Platform) => {
    const media = content.media;
    if (media.length === 0) return null;

    if (platform === 'instagram') {
      // Instagram uses carousel style
      const currentMedia = media[instagramMediaIndex] || media[0];
      return (
        <div className="mock-media-container square">
          {currentMedia.type === 'image' ? (
            <img src={currentMedia.url} alt="Instagram post" />
          ) : (
            <video src={currentMedia.url} controls muted loop />
          )}
          {media.length > 1 && (
            <>
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {instagramMediaIndex + 1}/{media.length}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '0',
                  right: '0',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {media.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setInstagramMediaIndex(idx)}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: idx === instagramMediaIndex ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    // Twitter limits to 4 items in a grid layout
    if (platform === 'twitter') {
      const items = media.slice(0, 4);
      const gridClass = 
        items.length === 2 ? 'mock-media-grid-2' : 
        items.length === 3 ? 'mock-media-grid-3' : 
        items.length >= 4 ? 'mock-media-grid-4' : '';

      return (
        <div className="mock-media-wrapper">
          <div className={`mock-media-grid ${gridClass}`} style={{ aspectRatio: items.length === 1 ? '16/9' : '1.8' }}>
            {items.map((item) => (
              <div key={item.id} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
                {item.type === 'image' ? (
                  <img src={item.url} alt="Tweet media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video src={item.url} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Facebook / LinkedIn: Grid representation
    const itemsToShow = media.slice(0, 4);
    const hasMore = media.length > 4;

    return (
      <div className="mock-media-container">
        <div className={`mock-media-grid ${media.length === 2 ? 'mock-media-grid-2' : media.length === 3 ? 'mock-media-grid-3' : media.length >= 4 ? 'mock-media-grid-4' : ''}`}>
          {itemsToShow.map((item, idx) => (
            <div key={item.id} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
              {item.type === 'image' ? (
                <img src={item.url} alt="Post attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={item.url} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {idx === 3 && hasMore && (
                <div className="mock-media-more-overlay">
                  +{media.length - 3}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMockCard = (platform: Platform) => {
    const text = getTextForPlatform(platform);
    
    switch (platform) {
      case 'twitter':
        return (
          <div key="twitter" className="mock-card twitter">
            <div className="card-header">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                className="card-avatar" 
                alt="Profile Avatar" 
              />
              <div className="card-user-info">
                <span className="card-user-name">
                  Jane Doe
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </span>
                <span className="card-user-handle">@janedoe · 1m</span>
              </div>
              <MoreHorizontal size={16} style={{ marginLeft: 'auto', color: '#71767b' }} />
            </div>
            
            <div className="card-content">
              {formatFeedText(text)}
            </div>

            {renderMediaGrid('twitter')}

            <div className="twitter-actions-bar">
              <div className="twitter-action reply"><MessageCircle size={16} /> <span>12</span></div>
              <div className="twitter-action retweet"><Repeat2 size={16} /> <span>5</span></div>
              <div className="twitter-action like"><Heart size={16} /> <span>142</span></div>
              <div className="twitter-action views"><Bookmark size={16} /> <span>3</span></div>
              <Share2 size={16} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        );

      case 'facebook':
        return (
          <div key="facebook" className="mock-card facebook">
            <div className="card-header">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                className="card-avatar" 
                alt="Profile Avatar" 
              />
              <div className="card-user-info">
                <span className="card-user-name">Jane Doe</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="card-post-time">1 min · </span>
                  <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <MoreHorizontal size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>

            <div className="card-content">
              {formatFeedText(text)}
            </div>

            {renderMediaGrid('facebook')}

            <div className="facebook-reactions-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ background: '#1877f2', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>👍</span>
                <span>Jane Doe and 24 others</span>
              </div>
              <div>4 comments</div>
            </div>

            <div className="facebook-actions-bar">
              <div className="facebook-action"><ThumbsUp size={16} /> <span>Like</span></div>
              <div className="facebook-action"><MessageCircle size={16} /> <span>Comment</span></div>
              <div className="facebook-action"><Share2 size={16} /> <span>Share</span></div>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div key="instagram" className="mock-card instagram">
            <div className="card-header">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                className="card-avatar" 
                alt="Profile Avatar" 
                style={{ border: '2px solid #e4405f', padding: '1px' }}
              />
              <div className="card-user-info">
                <span className="card-user-name">janedoe</span>
                <span className="card-post-time">New York, NY</span>
              </div>
              <MoreHorizontal size={18} style={{ marginLeft: 'auto', color: 'var(--text-primary)' }} />
            </div>

            {renderMediaGrid('instagram')}

            <div className="instagram-actions-bar">
              <div className="instagram-actions-left">
                <Heart size={22} style={{ cursor: 'pointer' }} />
                <MessageCircle size={22} style={{ cursor: 'pointer' }} />
                <Send size={22} style={{ cursor: 'pointer' }} />
              </div>
              <Bookmark size={22} style={{ cursor: 'pointer' }} />
            </div>

            <div className="instagram-likes">235 likes</div>
            
            <div className="instagram-caption">
              <span className="username">janedoe</span>
              {formatFeedText(text)}
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div key="linkedin" className="mock-card linkedin">
            <div className="card-header">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                className="card-avatar" 
                alt="Profile Avatar" 
              />
              <div className="card-user-info">
                <span className="card-user-name">
                  Jane Doe 
                  <span className="linkedin-user-badge">1st</span>
                </span>
                <span className="card-user-handle" style={{ fontSize: '0.75rem' }}>Product Marketing Manager | Tech Advocate</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="card-post-time">1m · </span>
                  <Globe2 size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <MoreHorizontal size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>

            <div className="card-content">
              {formatFeedText(text)}
            </div>

            {renderMediaGrid('linkedin')}

            <div className="linkedin-stats">
              <span>👍 15 · 💜 2</span>
              <span>3 comments</span>
            </div>

            <div className="linkedin-actions-bar">
              <div className="linkedin-action"><ThumbsUp size={16} /> <span>Like</span></div>
              <div className="linkedin-action"><MessageCircle size={16} /> <span>Comment</span></div>
              <div className="linkedin-action"><Share2 size={16} /> <span>Share</span></div>
              <div className="linkedin-action"><Send size={16} /> <span>Send</span></div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const platformsToRender = activePreviewTab === 'all' 
    ? selectedPlatforms 
    : selectedPlatforms.filter(p => p === activePreviewTab);

  return (
    <div className="glass-card">
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.25rem' 
        }}
      >
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          <Eye size={20} style={{ color: 'var(--border-focus)' }} />
          Live Mock Previews
        </h3>
        
        {/* Preview layout switches */}
        {selectedPlatforms.length > 1 && (
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setActivePreviewTab('all')}
              className={`preview-tab-btn ${activePreviewTab === 'all' ? 'active' : ''}`}
              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
            >
              <LayoutGrid size={12} /> Grid
            </button>
            {selectedPlatforms.map(p => (
              <button
                key={p}
                onClick={() => setActivePreviewTab(p)}
                className={`preview-tab-btn ${activePreviewTab === p ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.7rem', textTransform: 'capitalize' }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPlatforms.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '3rem 0' }}>
          Select one or more publishing channels to view live feed mockups.
        </div>
      ) : (
        <div className="mock-feed-container">
          {platformsToRender.map(platform => renderMockCard(platform))}
        </div>
      )}
    </div>
  );
};
