import React, { useRef, useEffect } from 'react';
import { ForegroundObject } from '../types/coco';

interface ForegroundPanelProps {
  foregroundObject: ForegroundObject | undefined;
  rotation: number;
}

const ForegroundPanel: React.FC<ForegroundPanelProps> = ({
  foregroundObject,
  rotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !foregroundObject) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = foregroundObject.image;
    const [x, y, width, height] = foregroundObject.bbox;
    const maxSize = 250;
    
    // Calculate scaled dimensions based on bbox
    const scale = Math.min(maxSize / width, maxSize / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    canvas.width = maxSize;
    canvas.height = maxSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Center the image and apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw only the cropped part of the image
    ctx.drawImage(img, x, y, width, height, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
  }, [foregroundObject, rotation]);

  if (!foregroundObject) {
    return (
      <div className="foreground-panel">
        <div className="no-object">
          <p>No object selected</p>
          <p>Select a class to see available objects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="foreground-panel">
      <div className="object-preview">
        <canvas ref={canvasRef} />
      </div>
      <div className="object-info">
        <div className="info-row">
          <span>Rotation:</span>
          <span>{rotation}°</span>
        </div>
        <div className="info-row">
          <span>Size:</span>
          <span>{Math.round(foregroundObject.bbox[2])} × {Math.round(foregroundObject.bbox[3])}</span>
        </div>
        <div className="info-row">
          <span>Area:</span>
          <span>{Math.round(foregroundObject.area)}</span>
        </div>
        <div className="rotation-hint">
          <p>Hold 'F' to rotate clockwise</p>
          <p>Hold 'D' to rotate counter-clockwise</p>
        </div>
      </div>
    </div>
  );
};

export default ForegroundPanel;
