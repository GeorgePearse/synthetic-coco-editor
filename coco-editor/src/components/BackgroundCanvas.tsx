import React, { useRef, useEffect, useCallback, useState } from 'react';
import { COCOImage, ForegroundObject, EditorState, COCOAnnotation, PlacedObject } from '../types/coco';

interface BackgroundCanvasProps {
  backgroundImage: COCOImage | undefined;
  backgroundImageElement: HTMLImageElement | undefined;
  foregroundObject: ForegroundObject | undefined;
  editorState: EditorState;
  updateEditorState: (updates: Partial<EditorState>) => void;
}

const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  backgroundImage,
  backgroundImageElement,
  foregroundObject,
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
    const radians = (editorState.currentRotation * Math.PI) / 180;
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
  }, [foregroundObject, backgroundImage, editorState.currentRotation, editorState.nextAnnotationId]);

  // Handle canvas click to place object
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas clicked with:', { 
      foregroundObject, 
      backgroundImage,
      hasImage: foregroundObject?.image ? true : false,
      imageComplete: foregroundObject?.image?.complete,
      imageWidth: foregroundObject?.image?.width,
      imageHeight: foregroundObject?.image?.height
    });
    if (!foregroundObject || !backgroundImage) {
      console.log('Missing foregroundObject or backgroundImage');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    try {
      const newAnnotation = createAnnotation(x, y);
      
      const placedObject: PlacedObject = {
        foregroundObject: foregroundObject,
        x: x,
        y: y,
        rotation: editorState.currentRotation,
        annotation: newAnnotation
      };
      
      updateEditorState({
        newAnnotations: [...editorState.newAnnotations, newAnnotation],
        placedObjects: [...editorState.placedObjects, placedObject],
        nextAnnotationId: editorState.nextAnnotationId + 1,
      });
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  }, [foregroundObject, backgroundImage, editorState.currentRotation, createAnnotation, editorState.newAnnotations, editorState.placedObjects, editorState.nextAnnotationId, updateEditorState]);

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

  // Helper function to create masked image from segmentation
  const createMaskedImage = useCallback((img: HTMLImageElement, segmentation: number[][], bbox: [number, number, number, number]): HTMLCanvasElement => {
    const [x, y, width, height] = bbox;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!maskCtx) return maskCanvas;
    
    console.log('Creating masked image:', { 
      imgWidth: img.width, 
      imgHeight: img.height, 
      bbox, 
      segmentationLength: segmentation.length,
      firstPolygonLength: segmentation[0]?.length 
    });
    
    // Draw the cropped portion of the image
    maskCtx.drawImage(img, x, y, width, height, 0, 0, width, height);
    
    // If no valid segmentation, just return the cropped image
    if (!segmentation || segmentation.length === 0 || segmentation[0]?.length === 0) {
      return maskCanvas;
    }
    
    // Create clipping mask from segmentation
    maskCtx.globalCompositeOperation = 'destination-in';
    maskCtx.fillStyle = 'black';
    maskCtx.beginPath();
    
    segmentation.forEach(polygon => {
      for (let i = 0; i < polygon.length; i += 2) {
        const px = polygon[i] - x;
        const py = polygon[i + 1] - y;
        if (i === 0) {
          maskCtx.moveTo(px, py);
        } else {
          maskCtx.lineTo(px, py);
        }
      }
      maskCtx.closePath();
    });
    
    maskCtx.fill();
    
    return maskCanvas;
  }, []);

  // Draw canvas content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    console.log('Drawing canvas with:', {
      foregroundObject,
      foregroundObjectImage: foregroundObject?.image,
      foregroundObjectImageComplete: foregroundObject?.image?.complete,
      foregroundObjectImageSrc: foregroundObject?.image?.src,
      isHovering,
      mousePos,
      rotation: editorState.currentRotation,
      placedObjectsCount: editorState.placedObjects.length
    });

    // Set canvas size to match background image
    canvas.width = backgroundImageElement.width;
    canvas.height = backgroundImageElement.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(backgroundImageElement, 0, 0);

    // Draw all placed objects
    editorState.placedObjects
      .filter(obj => obj.annotation.image_id === backgroundImage?.id)
      .forEach(placedObj => {
        if (placedObj.foregroundObject.image && placedObj.foregroundObject.image.complete) {
          ctx.save();
          
          // Create masked object
          const maskedObject = createMaskedImage(
            placedObj.foregroundObject.image, 
            placedObj.foregroundObject.segmentation, 
            placedObj.foregroundObject.bbox
          );
          
          // Apply rotation and position
          ctx.translate(placedObj.x, placedObj.y);
          ctx.rotate((placedObj.rotation * Math.PI) / 180);
          
          // Draw the masked object centered at placement position
          ctx.drawImage(maskedObject, -maskedObject.width / 2, -maskedObject.height / 2);
          
          ctx.restore();
        }
      });

    // Draw preview of object being placed
    if (isHovering && foregroundObject) {
      console.log('Drawing preview:', {
        hasImage: !!foregroundObject.image,
        imageWidth: foregroundObject.image?.width,
        imageHeight: foregroundObject.image?.height,
        bbox: foregroundObject.bbox
      });
      
      if (foregroundObject.image && foregroundObject.image.complete) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        
        // Create masked object
        const maskedObject = createMaskedImage(foregroundObject.image, foregroundObject.segmentation, foregroundObject.bbox);
        
        // Apply rotation and position
        ctx.translate(mousePos.x, mousePos.y);
        ctx.rotate((editorState.currentRotation * Math.PI) / 180);
        
        // Draw the masked object centered at cursor
        ctx.drawImage(maskedObject, -maskedObject.width / 2, -maskedObject.height / 2);
        
        ctx.restore();
      }
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
  }, [backgroundImageElement, backgroundImage, editorState.placedObjects, isHovering, mousePos, foregroundObject, editorState.currentRotation, createMaskedImage]);

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
