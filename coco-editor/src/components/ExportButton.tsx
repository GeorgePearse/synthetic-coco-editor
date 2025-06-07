import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { EditorState, COCODataset } from '../types/coco';

interface ExportButtonProps {
  editorState: EditorState;
}

const ExportButton: React.FC<ExportButtonProps> = ({ editorState }) => {
  const exportDataset = async () => {
    if (!editorState.dataset) return;

    try {
      const zip = new JSZip();
      
      // Create updated dataset with new annotations
      const updatedDataset: COCODataset = {
        ...editorState.dataset,
        annotations: [
          ...editorState.dataset.annotations,
          ...editorState.newAnnotations
        ]
      };

      // Add annotations.json to zip
      zip.file('annotations.json', JSON.stringify(updatedDataset, null, 2));

      // Add all background images to zip
      const imagesFolder = zip.folder('images');
      if (imagesFolder) {
        const imagePromises = Array.from(editorState.backgroundImages.entries()).map(async ([imageId, imageElement]) => {
          const imageInfo = editorState.dataset!.images.find(img => img.id === imageId);
          if (!imageInfo) return;

          // Convert image to blob
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = imageElement.width;
          canvas.height = imageElement.height;
          
          // Draw background
          ctx.drawImage(imageElement, 0, 0);

          // Draw placed objects on this image
          const placedObjectsForImage = editorState.placedObjects.filter(
            obj => obj.annotation.image_id === imageId
          );

          for (const placedObj of placedObjectsForImage) {
            ctx.save();
            
            // Create masked object from segmentation
            const maskCanvas = document.createElement('canvas');
            const [objX, objY, objWidth, objHeight] = placedObj.foregroundObject.bbox;
            maskCanvas.width = objWidth;
            maskCanvas.height = objHeight;
            const maskCtx = maskCanvas.getContext('2d');
            
            if (maskCtx) {
              // Draw the image onto the mask canvas
              maskCtx.drawImage(placedObj.foregroundObject.image, -objX, -objY);
              
              // Create clipping mask from segmentation
              maskCtx.globalCompositeOperation = 'destination-in';
              maskCtx.fillStyle = 'black';
              maskCtx.beginPath();
              
              placedObj.foregroundObject.segmentation.forEach(polygon => {
                for (let i = 0; i < polygon.length; i += 2) {
                  const px = polygon[i] - objX;
                  const py = polygon[i + 1] - objY;
                  if (i === 0) {
                    maskCtx.moveTo(px, py);
                  } else {
                    maskCtx.lineTo(px, py);
                  }
                }
                maskCtx.closePath();
              });
              
              maskCtx.fill();
              
              // Apply rotation and position
              ctx.translate(placedObj.x, placedObj.y);
              ctx.rotate((placedObj.rotation * Math.PI) / 180);
              
              // Draw the masked object centered at placement position
              ctx.drawImage(maskCanvas, -maskCanvas.width / 2, -maskCanvas.height / 2);
            }
            
            ctx.restore();
          }

          // Convert canvas to blob and add to zip
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
          });

          imagesFolder.file(imageInfo.file_name, blob);
        });

        await Promise.all(imagePromises);
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'updated-coco-dataset.zip');

    } catch (error) {
      console.error('Error exporting dataset:', error);
      alert('Error exporting dataset: ' + (error as Error).message);
    }
  };

  const hasChanges = editorState.newAnnotations.length > 0 || editorState.placedObjects.length > 0;

  return (
    <button
      onClick={exportDataset}
      disabled={!hasChanges}
      className={`export-button ${hasChanges ? 'has-changes' : ''}`}
    >
      Export Dataset {hasChanges && `(+${editorState.newAnnotations.length})`}
    </button>
  );
};

export default ExportButton;
