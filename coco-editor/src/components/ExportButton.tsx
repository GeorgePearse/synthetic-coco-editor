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
          const placedAnnotations = editorState.newAnnotations.filter(
            ann => ann.image_id === imageId
          );

          for (const annotation of placedAnnotations) {
            // Find the original foreground object
            const category = editorState.dataset!.categories.find(
              cat => cat.id === annotation.category_id
            );
            if (!category) continue;

            const foregroundObjects = editorState.foregroundObjects.get(annotation.category_id);
            if (!foregroundObjects || foregroundObjects.length === 0) continue;

            // For simplicity, use the first object of this category
            // In a full implementation, you'd track which specific object was placed
            const foregroundObject = foregroundObjects[0];
            
            const [x, y, width, height] = annotation.bbox;
            
            // Draw the object (simplified - no rotation applied here)
            ctx.drawImage(
              foregroundObject.image,
              x + width / 2 - foregroundObject.image.width / 2,
              y + height / 2 - foregroundObject.image.height / 2
            );
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

  const hasChanges = editorState.newAnnotations.length > 0;

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
