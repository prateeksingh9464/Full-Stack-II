import React, { useRef } from 'react';
import { Image, Video, X, Plus } from 'lucide-react';
import type { MediaAttachment } from '../types';

interface MediaUploaderProps {
  media: MediaAttachment[];
  onAddMedia: (files: FileList) => void;
  onRemoveMedia: (id: string) => void;
  maxFiles?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  media,
  onAddMedia,
  onRemoveMedia,
  maxFiles = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMedia(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddMedia(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="media-uploader">
      {media.length < maxFiles && (
        <div
          className="upload-dropzone"
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
          <div className="upload-dropzone-content">
            <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--border-focus)' }}>
              <Image size={24} />
              <Video size={24} />
            </div>
            <p style={{ fontWeight: 600 }}>Drag & drop images/videos or click to upload</p>
            <span>Supports JPG, PNG, GIF, MP4 (Max {maxFiles} files)</span>
          </div>
        </div>
      )}

      {media.length > 0 && (
        <div className="media-preview-grid">
          {media.map((item) => (
            <div key={item.id} className="media-preview-item">
              {item.type === 'image' ? (
                <img src={item.url} alt="Upload preview" />
              ) : (
                <video src={item.url} muted playsInline />
              )}
              <button
                type="button"
                className="media-remove-btn"
                onClick={() => onRemoveMedia(item.id)}
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {media.length < maxFiles && (
            <div
              className="media-preview-item"
              onClick={triggerFileInput}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--border-color)',
                cursor: 'pointer',
                background: 'var(--bg-tertiary)',
              }}
            >
              <Plus size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
