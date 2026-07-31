import { useState, useEffect } from 'react';
import { Sun, Moon, Calendar, FileText, Send, Trash2, CheckCircle2 } from 'lucide-react';
import type { Platform, PostContent } from './types';
import { PlatformSelector } from './components/PlatformSelector';
import { Composer } from './components/Composer';
import { PreviewArea } from './components/PreviewArea';
import { ValidationPanel } from './components/ValidationPanel';
import { validatePost } from './utils/validation';

const LOCAL_STORAGE_KEY = 'omnipost_studio_draft';

const DEFAULT_CONTENT: PostContent = {
  unifiedText: 'Announcing the launch of our next-gen social publishing pipeline! 🌟 Effortlessly craft, customize, and validate posts across multiple networks in real-time. #WebDev #FullStack #TechInnovations',
  customTexts: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  },
  isCustomized: false,
  media: [],
};

function App() {
  const [theme, setTheme] = useState<'light-mode' | 'dark-mode'>('dark-mode');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter', 'facebook']);
  const [content, setContent] = useState<PostContent>(DEFAULT_CONTENT);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);

  // Load draft and theme from LocalStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Ensure we recreate standard structures but drop file handles from localStorage
        setContent({
          ...parsed,
          media: [], // File objects cannot be fully serialized, so we start fresh with media
        });
      } catch (e) {
        console.error('Error parsing draft from localStorage', e);
      }
    }

    const savedTheme = localStorage.getItem('composer_theme');
    if (savedTheme === 'light-mode' || savedTheme === 'dark-mode') {
      setTheme(savedTheme);
    }
  }, []);

  // Update body class for themes
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('composer_theme', theme);
  }, [theme]);

  // Save draft to localStorage (excluding media file objects)
  const saveDraftLocally = (updatedContent: PostContent) => {
    const serialized = {
      unifiedText: updatedContent.unifiedText,
      customTexts: updatedContent.customTexts,
      isCustomized: updatedContent.isCustomized,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serialized));
  };

  const handleContentChange = (newContent: PostContent) => {
    setContent(newContent);
    saveDraftLocally(newContent);
  };

  const handleTogglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light-mode' ? 'dark-mode' : 'light-mode'));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the editor? This will erase all text and remove media.')) {
      // Revoke urls for memory
      content.media.forEach((m) => URL.revokeObjectURL(m.url));
      
      const clearedContent: PostContent = {
        unifiedText: '',
        customTexts: { twitter: '', facebook: '', instagram: '', linkedin: '' },
        isCustomized: false,
        media: [],
      };
      setContent(clearedContent);
      saveDraftLocally(clearedContent);
      showToast('Composer cleared successfully!');
    }
  };

  const handleSaveDraft = () => {
    saveDraftLocally(content);
    showToast('Draft saved successfully to browser storage!');
  };

  const handlePublishNow = () => {
    showToast('Post published successfully to all selected channels! 🎉');
  };

  const handleSchedulePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDateTime) return;
    
    const formattedDate = new Date(scheduleDateTime).toLocaleString();
    setShowScheduleModal(false);
    showToast(`Post successfully scheduled for ${formattedDate}! 📅`);
  };

  const showToast = (message: string) => {
    setToast({ message, type: 'success' });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Compute validations in real time
  const validationResults = validatePost(content);

  // Check if overall state is valid (no platform errors)
  const isPostValid = 
    selectedPlatforms.length > 0 &&
    selectedPlatforms.every((platform) => validationResults[platform]?.isValid);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="header-bar">
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>OmniPost Studio</h1>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '9999px', 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--border-focus)',
              color: 'var(--border-focus)',
              letterSpacing: '0.05em'
            }}>EXP 1.1.1</span>
          </div>
          <p>Multi-channel content composer, real-time validator, and live feed preview platform.</p>
        </div>

        <div className="actions-section">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'light-mode' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light-mode' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Dashboard Panel Grid */}
      <main className="dashboard-grid">
        {/* Left Side: Editor Panels */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 className="card-title">Select Channels</h3>
            
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onTogglePlatform={handleTogglePlatform}
            />

            <Composer
              selectedPlatforms={selectedPlatforms}
              content={content}
              onContentChange={handleContentChange}
              validationResults={validationResults}
            />

            {/* Bottom Actions */}
            <div className="composer-footer">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="footer-btn"
                  onClick={handleSaveDraft}
                  title="Save current state"
                >
                  <FileText size={16} />
                  Save Draft
                </button>
                <button
                  type="button"
                  className="footer-btn"
                  onClick={handleClearAll}
                  style={{ color: 'var(--error)' }}
                  title="Clear editor text and media"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="footer-btn"
                  onClick={() => setShowScheduleModal(true)}
                  disabled={selectedPlatforms.length === 0 || !isPostValid}
                  title="Schedule post publishing"
                >
                  <Calendar size={16} />
                  Schedule
                </button>
                <button
                  type="button"
                  className="footer-btn footer-btn-primary"
                  onClick={handlePublishNow}
                  disabled={selectedPlatforms.length === 0 || !isPostValid}
                  title="Publish post immediately"
                >
                  <Send size={16} />
                  Publish Now
                </button>
              </div>
            </div>
          </div>

          {/* Validation Checklist Panel */}
          <ValidationPanel
            selectedPlatforms={selectedPlatforms}
            validationResults={validationResults}
          />
        </section>

        {/* Right Side: Live Previews */}
        <section>
          <PreviewArea
            selectedPlatforms={selectedPlatforms}
            content={content}
          />
        </section>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Publication</h3>
              <button className="modal-close-btn" onClick={() => setShowScheduleModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSchedulePost}>
              <div className="modal-body">
                <label className="modal-label">
                  Choose publication date and time:
                  <input
                    type="datetime-local"
                    required
                    className="modal-input"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </label>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="footer-btn"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="footer-btn footer-btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Success Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
