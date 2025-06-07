import React, { useRef } from 'react';
import JSZip from 'jszip';
import { COCODataset, EditorState, ForegroundObject } from '../types/coco';

interface DatasetUploaderProps {
  onDatasetLoaded: (state: Partial<EditorState>) => void;
}

const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onDatasetLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractForegroundObjects = async (
    dataset: COCODataset,
    imageFiles: Map<string, Blob>
  ): Promise<Map<number, ForegroundObject[]>> => {
    const foregroundObjects = new Map<number, ForegroundObject[]>();
    
    for (const annotation of dataset.annotations) {
      if (annotation.iscrowd === 1) continue;
      
      const image = dataset.images.find(img => img.id === annotation.image_id);
      if (!image) continue;

      const imageBlob = imageFiles.get(image.file_name);
      if (!imageBlob) continue;

      try {
        const imageElement = new Image();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve;
          imageElement.onerror = reject;
          imageElement.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const [x, y, width, height] = annotation.bbox;
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(imageElement, x, y, width, height, 0, 0, width, height);
        
        const croppedImage = new Image();
        const croppedDataUrl = canvas.toDataURL();
        
        await new Promise((resolve, reject) => {
          croppedImage.onload = resolve;
          croppedImage.onerror = reject;
          croppedImage.src = croppedDataUrl;
        });
        
        // Store the original full image as well for drawing
        croppedImage.dataset.fullImage = imageElement.src;

        const foregroundObject: ForegroundObject = {
          id: `obj_${annotation.id}`,
          category_id: annotation.category_id,
          image: imageElement, // Use the full image instead of cropped
          mask: null, // TODO: Extract mask from segmentation
          bbox: annotation.bbox,
          segmentation: Array.isArray(annotation.segmentation) ? 
            (annotation.segmentation as number[][]) : 
            [],
          area: annotation.area,
          originalAnnotation: annotation,
        };
        
        console.log('Created foreground object:', {
          id: foregroundObject.id,
          category_id: foregroundObject.category_id,
          hasImage: !!foregroundObject.image,
          imageComplete: foregroundObject.image.complete,
          imageWidth: foregroundObject.image.width,
          imageHeight: foregroundObject.image.height
        });

        const categoryObjects = foregroundObjects.get(annotation.category_id) || [];
        categoryObjects.push(foregroundObject);
        foregroundObjects.set(annotation.category_id, categoryObjects);

        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.warn(`Failed to process annotation ${annotation.id}:`, error);
      }
    }

    return foregroundObjects;
  };

  const loadBackgroundImages = async (
    dataset: COCODataset,
    imageFiles: Map<string, Blob>
  ): Promise<Map<number, HTMLImageElement>> => {
    const backgroundImages = new Map<number, HTMLImageElement>();
    
    for (const imageInfo of dataset.images) {
      const imageBlob = imageFiles.get(imageInfo.file_name);
      if (!imageBlob) continue;

      try {
        const imageElement = new Image();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve;
          imageElement.onerror = reject;
          imageElement.src = imageUrl;
        });

        backgroundImages.set(imageInfo.id, imageElement);
        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.warn(`Failed to load image ${imageInfo.file_name}:`, error);
      }
    }

    return backgroundImages;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      let annotationsJson: string | null = null;
      const imageFiles = new Map<string, Blob>();

      for (const filename in zipContent.files) {
        const zipFile = zipContent.files[filename];
        
        if (filename.toLowerCase().includes('annotations.json') || filename.toLowerCase() === 'annotations.json') {
          annotationsJson = await zipFile.async('string');
        } else if (filename.match(/\.(jpg|jpeg|png|bmp|gif)$/i)) {
          const blob = await zipFile.async('blob');
          const baseFilename = filename.split('/').pop() || filename;
          imageFiles.set(baseFilename, blob);
        }
      }

      if (!annotationsJson) {
        alert('No annotations.json file found in the zip archive');
        return;
      }

      const dataset: COCODataset = JSON.parse(annotationsJson);
      
      // Load background images
      const backgroundImages = await loadBackgroundImages(dataset, imageFiles);
      
      // Extract foreground objects
      const foregroundObjects = await extractForegroundObjects(dataset, imageFiles);

      // Set initial state
      const firstCategory = dataset.categories[0];
      const maxAnnotationId = Math.max(...dataset.annotations.map(ann => ann.id), 0);

      onDatasetLoaded({
        dataset,
        backgroundImages,
        foregroundObjects,
        selectedCategoryId: firstCategory?.id || null,
        currentBackgroundIndex: 0,
        currentForegroundIndex: 0,
        currentRotation: 0,
        newAnnotations: [],
        placedObjects: [],
        nextAnnotationId: maxAnnotationId + 1,
      });

    } catch (error) {
      console.error('Error loading dataset:', error);
      alert('Error loading dataset: ' + (error as Error).message);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadLocalDataset = async () => {
    try {
      // Load the local tiny COCO dataset
      const response = await fetch('/tiny_coco/annotations/instances_train2017.json');
      if (!response.ok) throw new Error('Failed to load local dataset annotations');
      
      const dataset: COCODataset = await response.json();
      
      // Load images from the local dataset
      const backgroundImages = new Map<number, HTMLImageElement>();
      const imageFiles = new Map<string, Blob>();
      
      for (const imageInfo of dataset.images) {
        try {
          const imageResponse = await fetch(`/tiny_coco/train2017/${imageInfo.file_name}`);
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            imageFiles.set(imageInfo.file_name, blob);
            
            const imageElement = new Image();
            const imageUrl = URL.createObjectURL(blob);
            
            await new Promise((resolve, reject) => {
              imageElement.onload = resolve;
              imageElement.onerror = reject;
              imageElement.src = imageUrl;
            });
            
            backgroundImages.set(imageInfo.id, imageElement);
            URL.revokeObjectURL(imageUrl);
          }
        } catch (error) {
          console.warn(`Failed to load local image ${imageInfo.file_name}:`, error);
        }
      }
      
      // Extract foreground objects
      const foregroundObjects = await extractForegroundObjects(dataset, imageFiles);
      
      // Set initial state
      const firstCategory = dataset.categories[0];
      const maxAnnotationId = Math.max(...dataset.annotations.map(ann => ann.id), 0);
      
      onDatasetLoaded({
        dataset,
        backgroundImages,
        foregroundObjects,
        selectedCategoryId: firstCategory?.id || null,
        currentBackgroundIndex: 0,
        currentForegroundIndex: 0,
        currentRotation: 0,
        newAnnotations: [],
        nextAnnotationId: maxAnnotationId + 1,
      });
      
    } catch (error) {
      console.error('Error loading local dataset:', error);
      alert('Error loading local dataset: ' + (error as Error).message);
    }
  };

  return (
    <div className="dataset-uploader">
      <div className="dataset-options">
        <button onClick={loadLocalDataset} className="upload-button">
          Use Local Tiny COCO
        </button>
        <span className="option-separator">or</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="dataset-upload"
        />
        <label htmlFor="dataset-upload" className="upload-button">
          Upload COCO Dataset
        </label>
      </div>
    </div>
  );
};

export default DatasetUploader;
