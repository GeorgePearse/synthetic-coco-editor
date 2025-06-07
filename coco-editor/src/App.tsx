import React, { useState, useCallback } from 'react';
import { EditorState } from './types/coco';
import DatasetUploader from './components/DatasetUploader';
import ClassDropdown from './components/ClassDropdown';
import ForegroundPanel from './components/ForegroundPanel';
import BackgroundCanvas from './components/BackgroundCanvas';
import NavigationControls from './components/NavigationControls';
import ExportButton from './components/ExportButton';
import './App.css';

function App() {
  const [editorState, setEditorState] = useState<EditorState>({
    dataset: null,
    backgroundImages: new Map(),
    foregroundObjects: new Map(),
    selectedCategoryId: null,
    currentBackgroundIndex: 0,
    currentForegroundIndex: 0,
    currentRotation: 0,
    newAnnotations: [],
    placedObjects: [],
    nextAnnotationId: 1,
  });

  const updateEditorState = useCallback((updates: Partial<EditorState>) => {
    setEditorState(prev => ({ ...prev, ...updates }));
  }, []);

  const onDatasetLoaded = useCallback((loadedState: Partial<EditorState>) => {
    setEditorState(prev => ({ ...prev, ...loadedState }));
  }, []);

  const currentBackgroundImage = editorState.dataset?.images[editorState.currentBackgroundIndex];
  const currentForegroundObjects = editorState.selectedCategoryId ? 
    editorState.foregroundObjects.get(editorState.selectedCategoryId) || [] : 
    [];
  const currentForegroundObject = currentForegroundObjects[editorState.currentForegroundIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>COCO Dataset Editor</h1>
        <div className="header-controls">
          <DatasetUploader onDatasetLoaded={onDatasetLoaded} />
          {editorState.dataset && <ExportButton editorState={editorState} />}
        </div>
      </header>

      {!editorState.dataset ? (
        <div className="welcome-screen">
          <h2>Upload a COCO dataset to get started</h2>
          <p>Select a zip file containing images and annotations.json</p>
        </div>
      ) : (
        <div className="editor-layout">
          <div className="left-panel">
            <ClassDropdown 
              categories={editorState.dataset.categories}
              selectedCategoryId={editorState.selectedCategoryId}
              onCategoryChange={(categoryId) => 
                updateEditorState({ 
                  selectedCategoryId: categoryId,
                  currentForegroundIndex: 0 
                })
              }
            />
            <NavigationControls 
              editorState={editorState}
              updateEditorState={updateEditorState}
              currentForegroundObjects={currentForegroundObjects}
            />
            <ForegroundPanel 
              foregroundObject={currentForegroundObject}
              rotation={editorState.currentRotation}
            />
          </div>

          <div className="main-panel">
            <BackgroundCanvas 
              backgroundImage={currentBackgroundImage}
              backgroundImageElement={currentBackgroundImage ? 
                editorState.backgroundImages.get(currentBackgroundImage.id) : 
                undefined
              }
              foregroundObject={currentForegroundObject}
              editorState={editorState}
              updateEditorState={updateEditorState}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
