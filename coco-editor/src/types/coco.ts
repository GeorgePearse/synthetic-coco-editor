export interface COCOInfo {
  year: number;
  version: string;
  description: string;
  contributor: string;
  url: string;
  date_created: string;
}

export interface COCOLicense {
  id: number;
  name: string;
  url: string;
}

export interface COCOImage {
  id: number;
  width: number;
  height: number;
  file_name: string;
  license?: number;
  flickr_url?: string;
  coco_url?: string;
  date_captured?: string;
}

export interface COCOCategory {
  id: number;
  name: string;
  supercategory: string;
}

export interface COCOAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: number[][] | { counts: string; size: number[] };
  area: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  iscrowd: 0 | 1;
}

export interface COCODataset {
  info: COCOInfo;
  licenses: COCOLicense[];
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}

export interface ForegroundObject {
  id: string;
  category_id: number;
  image: HTMLImageElement;
  mask: ImageData | null;
  bbox: [number, number, number, number];
  segmentation: number[][];
  area: number;
  originalAnnotation: COCOAnnotation;
}

export interface PlacedObject {
  foregroundObject: ForegroundObject;
  x: number;
  y: number;
  rotation: number;
  annotation: COCOAnnotation;
}

export interface EditorState {
  dataset: COCODataset | null;
  backgroundImages: Map<number, HTMLImageElement>;
  foregroundObjects: Map<number, ForegroundObject[]>; // Map by category_id
  selectedCategoryId: number | null;
  currentBackgroundIndex: number;
  currentForegroundIndex: number;
  currentRotation: number;
  newAnnotations: COCOAnnotation[];
  placedObjects: PlacedObject[];
  nextAnnotationId: number;
}
