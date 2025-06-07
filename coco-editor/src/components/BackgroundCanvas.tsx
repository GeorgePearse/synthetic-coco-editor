import React, { useRef, useEffect, useCallback, useState } from 'react';
import { COCOImage, ForegroundObject, EditorState, COCOAnnotation } from '../types/coco';

interface BackgroundCanvasProps {
  backgroundImage: COCOImage | undefined;
  backgroundImageElement: HTMLImageElement | undefined;
  foregroundObject: ForegroundObject | undefined;
  rotation: number;
  editorState: EditorState;
  updateEditorState: (updates: Partial<EditorState>) => void;
}

const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  backgroundImage,
  backgroundImageElement,
  foregroundObject,
  rotation,
  editorState,
  updateEditorState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Handle key events for rotation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      
      if (event.key.toLowerCase() === 'f') {
        // Rotate clockwise
        const newRotation = (editorState.currentRotation + 15) % 360;
        updateEditorState({ currentRotation: newRotation });
      } else if (event.key.toLowerCase() === 'd') {
        // Rotate counter-clockwise
        const newRotation = (editorState.currentRotation - 15 + 360) % 360;
        updateEditorState({ currentRotation: newRotation });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState.currentRotation, updateEditorState]);

  // Generate new annotation when object is placed
  const createAnnotation = useCallback((x: number, y: number): COCOAnnotation => {
    if (!foregroundObject || !backgroundImage) {
      throw new Error('Cannot create annotation without foreground object and background image');
    }

    const [origX, origY, width, height] = foregroundObject.bbox;
    
    // Calculate rotated bounding box (simplified - assumes axis-aligned after rotation)
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = width * sin + height * cos;
    
    const newBbox: [number, number, number, number] = [
      x - rotatedWidth / 2,
      y - rotatedHeight / 2,
      rotatedWidth,
      rotatedHeight
    ];

    // For now, use the original segmentation (in practice, you'd rotate it)
    const rotatedSegmentation = foregroundObject.segmentation.map(polygon => 
      polygon.map((coord, index) => {
        if (index % 2 === 0) {
          // X coordinate
          return coord - origX + x - rotatedWidth / 2;
        } else {
          // Y coordinate  
          return coord - origY + y - rotatedHeight / 2;
        }
      })
    );

    return {
      id: editorState.nextAnnotationId,
      image_id: backgroundImage.id,
      category_id: foregroundObject.category_id,
      segmentation: rotatedSegmentation,
      area: foregroundObject.area,
      bbox: newBbox,
      iscrowd: 0,
    };
  }, [foregroundObject, backgroundImage, rotation, editorState.nextAnnotationId]);

  // Handle canvas click to place object
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!foregroundObject || !backgroundImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    try {
      const newAnnotation = createAnnotation(x, y);
      
      updateEditorState({
        newAnnotations: [...editorState.newAnnotations, newAnnotation],
        nextAnnotationId: editorState.nextAnnotationId + 1,
      });
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  }, [foregroundObject, backgroundImage, createAnnotation, editorState.newAnnotations, editorState.nextAnnotationId, updateEditorState]);

  // Handle mouse movement for preview
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setMousePos({ x, y });
  }, []);

  // Draw canvas content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match background image
    canvas.width = backgroundImageElement.width;
    canvas.height = backgroundImageElement.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(backgroundImageElement, 0, 0);

    // Draw existing annotations (placeholder objects)
    editorState.newAnnotations
      .filter(ann => ann.image_id === backgroundImage?.id)
      .forEach(ann => {
        const [x, y, width, height] = ann.bbox;
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw category name
        if (editorState.dataset) {
          const category = editorState.dataset.categories.find(cat => cat.id === ann.category_id);
          if (category) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '14px Arial';
            ctx.fillText(category.name, x, y - 5);
          }
        }
      });

    // Draw preview of object being placed
    if (isHovering && foregroundObject) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.translate(mousePos.x, mousePos.y);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const img = foregroundObject.image;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      ctx.restore();
    }

    // Draw crosshair
    if (isHovering) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(canvas.width, mousePos.y);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, canvas.height);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }
  }, [backgroundImageElement, backgroundImage, editorState.newAnnotations, editorState.dataset, isHovering, mousePos, foregroundObject, rotation]);

  if (!backgroundImageElement) {
    return (
      <div className="canvas-container">
        <div className="no-background">
          <p>No background image available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="background-canvas"
      />
    </div>
  );
};

export default BackgroundCanvas;
