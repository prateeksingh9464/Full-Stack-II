import React, { useState, useRef } from 'react';
import { Smile, Sparkles, Sliders } from 'lucide-react';
import type { Platform, PostContent, ValidationResult } from '../types';
import { PLATFORM_CONFIGS } from '../types';
import { MediaUploader } from './MediaUploader';

interface ComposerProps {
  selectedPlatforms: Platform[];
  content: PostContent;
  onContentChange: (content: PostContent) => void;
  validationResults: Record<Platform, ValidationResult>;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '🔥', '🚀', '✨', '❤️', '👏', '🤔', '👀', '💡', '📅', '📌', '💯'];

export const Composer: React.FC<ComposerProps> = ({
  selectedPlatforms,
  content,
  onContentChange,
  validationResults,
}) => {
  const [activeCustomTab, setActiveCustomTab] = useState<Platform>('twitter');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set active editing tab if the current active tab is not selected
  React.useEffect(() => {
    if (!selectedPlatforms.includes(activeCustomTab)) {
      if (selectedPlatforms.length > 0) {
        setActiveCustomTab(selectedPlatforms[0]);
      }
    }
  }, [selectedPlatforms, activeCustomTab]);

  const handleTextChange = (text: string) => {
    if (content.isCustomized) {
      onContentChange({
        ...content,
        customTexts: {
          ...content.customTexts,
          [activeCustomTab]: text,
        },
      });
    } else {
      onContentChange({
        ...content,
        unifiedText: text,
      });
    }
  };

  const handleToggleCustomized = () => {
    const nextCustomized = !content.isCustomized;
    let nextCustomTexts = { ...content.customTexts };
    
    // Copy unified text to empty platform texts when turning customization ON
    if (nextCustomized) {
      selectedPlatforms.forEach((p) => {
        if (!nextCustomTexts[p]) {
          nextCustomTexts[p] = content.unifiedText;
        }
      });
    }

    onContentChange({
      ...content,
      isCustomized: nextCustomized,
      customTexts: nextCustomTexts,
    });
  };

  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = content.isCustomized ? content.customTexts[activeCustomTab] : content.unifiedText;
    
    const newText = 
      currentText.substring(0, startPos) + 
      emoji + 
      currentText.substring(endPos, currentText.length);

    handleTextChange(newText);
    setEmojiPickerOpen(false);

    // Reposition cursor and refocus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
    }, 10);
  };

  const handleAddMedia = (files: FileList) => {
    const newAttachments = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      file,
    }));

    onContentChange({
      ...content,
      media: [...content.media, ...newAttachments],
    });
  };

  const handleRemoveMedia = (id: string) => {
    // Revoke the object url to prevent memory leaks
    const itemToRemove = content.media.find((m) => m.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.url);
    }

    onContentChange({
      ...content,
      media: content.media.filter((m) => m.id !== id),
    });
  };

  // Get current editing config and character stats
  const currentEditingPlatform = content.isCustomized ? activeCustomTab : selectedPlatforms[0] || 'twitter';
  const currentConfig = PLATFORM_CONFIGS[currentEditingPlatform];
  const currentText = content.isCustomized 
    ? content.customTexts[activeCustomTab] || '' 
    : content.unifiedText;
    
  const charCount = currentText.length;
  const isOverLimit = charCount > currentConfig.maxChars;
  const isWarningLimit = charCount >= currentConfig.warningChars;

  // Calculate circular progress indicator
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(charCount / currentConfig.maxChars, 1);
  const strokeDashoffset = circumference - progressRatio * circumference;

  let progressColor = 'var(--success)';
  if (isOverLimit) progressColor = 'var(--error)';
  else if (isWarningLimit) progressColor = 'var(--warning)';

  return (
    <div className="glass-card">
      <h3 className="card-title">
        <Sparkles size={20} style={{ color: 'var(--border-focus)' }} />
        Create Post
      </h3>

      {/* Mode Selector Toggle */}
      {selectedPlatforms.length > 1 && (
        <div className="toggle-mode-container">
          <div className="toggle-mode-info">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sliders size={14} style={{ color: 'var(--border-focus)' }} />
              Customize Content per Platform
            </h4>
            <p>Write unique text for Twitter, Instagram, etc.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={content.isCustomized}
              onChange={handleToggleCustomized}
            />
            <span className="slider"></span>
          </label>
        </div>
      )}

      {/* Platform Tabs when Customize Content is ON */}
      {content.isCustomized && selectedPlatforms.length > 1 && (
        <div className="custom-tabs">
          {selectedPlatforms.map((platform) => {
            const config = PLATFORM_CONFIGS[platform];
            const result = validationResults[platform];
            const hasError = result && !result.isValid;
            
            return (
              <button
                key={platform}
                type="button"
                className={`custom-tab-btn ${activeCustomTab === platform ? 'active' : ''}`}
                onClick={() => setActiveCustomTab(platform)}
                style={{
                  ['--accent-color' as any]: config.color,
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                {hasError && (
                  <span 
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--error)',
                      display: 'inline-block'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Editor Textarea */}
      <div className="editor-wrapper">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={currentText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={selectedPlatforms.length === 0 ? 'Select a platform above to get started...' : currentConfig.placeholder}
          disabled={selectedPlatforms.length === 0}
          style={{
            borderColor: isOverLimit ? 'var(--error)' : isWarningLimit ? 'var(--warning)' : undefined,
          }}
        />

        {/* Action bar overlays inside editor */}
        {selectedPlatforms.length > 0 && (
          <div className="editor-actions">
            <div className="editor-actions-left">
              <button
                type="button"
                className="editor-icon-btn"
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              {emojiPickerOpen && (
                <div className="emoji-drawer">
                  <div className="emoji-drawer-header">
                    <span>Popular Emojis</span>
                    <button 
                      onClick={() => setEmojiPickerOpen(false)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Close
                    </button>
                  </div>
                  <div className="emoji-grid">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="emoji-btn"
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="editor-actions-right">
              {/* Circular progress and word limits */}
              <div className="char-progress-container">
                <span 
                  className="char-counter-text"
                  style={{
                    color: isOverLimit ? 'var(--error)' : undefined,
                    fontWeight: isOverLimit || isWarningLimit ? 700 : undefined
                  }}
                >
                  {charCount} / {currentConfig.maxChars}
                </span>

                <svg className="char-ring" viewBox="0 0 24 24">
                  <circle className="char-ring-bg" cx="12" cy="12" r={radius} />
                  <circle
                    className="char-ring-progress"
                    cx="12"
                    cy="12"
                    r={radius}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      ['--progress-color' as any]: progressColor,
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Uploader Section */}
      {selectedPlatforms.length > 0 && (
        <MediaUploader
          media={content.media}
          onAddMedia={handleAddMedia}
          onRemoveMedia={handleRemoveMedia}
        />
      )}
    </div>
  );
};
