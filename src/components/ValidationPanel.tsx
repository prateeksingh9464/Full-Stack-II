import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Platform, ValidationResult } from '../types';
import { PLATFORM_CONFIGS } from '../types';

interface ValidationPanelProps {
  selectedPlatforms: Platform[];
  validationResults: Record<Platform, ValidationResult>;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  selectedPlatforms,
  validationResults,
}) => {
  // Get active issues for selected platforms
  const activeResults = selectedPlatforms.map(p => validationResults[p]);
  

  
  // Group all validations
  const allIssues = activeResults.flatMap(result => 
    result.errors.map(err => ({
      platform: result.platform,
      ...err
    }))
  );

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <h3 className="card-title">
        <AlertCircle size={20} style={{ color: 'var(--border-focus)' }} />
        Real-Time Validation
      </h3>

      {selectedPlatforms.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
          Select one or more platforms above to view validation feedback.
        </div>
      ) : allIssues.length === 0 ? (
        <div className="validation-list">
          <div className="validation-item success">
            <CheckCircle2 className="validation-icon" size={18} />
            <div className="validation-text-container">
              <span className="validation-platform-badge" style={{ color: 'var(--success)' }}>
                All Good
              </span>
              <span className="validation-message" style={{ color: 'var(--text-secondary)' }}>
                Content fits all constraints for selected platforms! Ready to publish.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="validation-list">
          {allIssues.map((issue, idx) => {
            const platformConfig = PLATFORM_CONFIGS[issue.platform];
            const isError = issue.type === 'error';
            
            return (
              <div 
                key={`${issue.platform}-${idx}`} 
                className={`validation-item ${isError ? 'error' : 'warning'}`}
              >
                {isError ? (
                  <AlertCircle className="validation-icon" size={18} />
                ) : (
                  <AlertTriangle className="validation-icon" size={18} />
                )}
                
                <div className="validation-text-container">
                  <span 
                    className="validation-platform-badge" 
                    style={{ color: platformConfig.color }}
                  >
                    {platformConfig.name}
                  </span>
                  <span className="validation-message" style={{ color: 'var(--text-primary)' }}>
                    {issue.message}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
