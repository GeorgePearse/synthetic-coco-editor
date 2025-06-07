import React from 'react';
import { EditorState, ForegroundObject } from '../types/coco';

interface NavigationControlsProps {
  editorState: EditorState;
  updateEditorState: (updates: Partial<EditorState>) => void;
  currentForegroundObjects: ForegroundObject[];
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  editorState,
  updateEditorState,
  currentForegroundObjects,
}) => {
  const { dataset, currentBackgroundIndex, currentForegroundIndex } = editorState;
  
  if (!dataset) return null;

  const totalBackgrounds = dataset.images.length;
  const totalForegrounds = currentForegroundObjects.length;

  const navigateBackground = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentBackgroundIndex + 1) % totalBackgrounds
      : (currentBackgroundIndex - 1 + totalBackgrounds) % totalBackgrounds;
    updateEditorState({ currentBackgroundIndex: newIndex });
  };

  const navigateForeground = (direction: 'prev' | 'next') => {
    if (totalForegrounds === 0) return;
    
    const newIndex = direction === 'next'
      ? (currentForegroundIndex + 1) % totalForegrounds
      : (currentForegroundIndex - 1 + totalForegrounds) % totalForegrounds;
    updateEditorState({ currentForegroundIndex: newIndex });
  };

  return (
    <div className="navigation-controls">
      <div className="control-group">
        <label>Background Image</label>
        <div className="nav-buttons">
          <button 
            className="nav-btn" 
            onClick={() => navigateBackground('prev')}
            disabled={totalBackgrounds <= 1}
          >
            ← Prev
          </button>
          <button 
            className="nav-btn" 
            onClick={() => navigateBackground('next')}
            disabled={totalBackgrounds <= 1}
          >
            Next →
          </button>
        </div>
        <div className="index-display">
          {currentBackgroundIndex + 1} / {totalBackgrounds}
        </div>
      </div>

      <div className="control-group">
        <label>Foreground Object</label>
        <div className="nav-buttons">
          <button 
            className="nav-btn" 
            onClick={() => navigateForeground('prev')}
            disabled={totalForegrounds <= 1}
          >
            ← Prev
          </button>
          <button 
            className="nav-btn" 
            onClick={() => navigateForeground('next')}
            disabled={totalForegrounds <= 1}
          >
            Next →
          </button>
        </div>
        <div className="index-display">
          {totalForegrounds > 0 ? `${currentForegroundIndex + 1} / ${totalForegrounds}` : '0 / 0'}
        </div>
      </div>
    </div>
  );
};

export default NavigationControls;
