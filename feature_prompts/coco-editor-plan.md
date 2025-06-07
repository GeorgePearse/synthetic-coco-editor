# COCO Dataset Editor - Detailed Plan

## Overview
A React-based UI for editing COCO datasets by pasting foreground objects onto background images while maintaining proper COCO annotation format.

## Core Functionality

### Dataset Upload
- User uploads existing COCO dataset (zip file containing images + annotations.json)
- Parse COCO annotation format to extract:
  - Background images
  - Existing object instances (for foreground objects)
  - Class definitions and names
  - Existing annotations

### UI Layout
```
┌─────────────────┬────────────────────────────┐
│ Class Dropdown  │                            │
├─────────────────┤        Background          │
│                 │         Image              │
│                 │       (Main Canvas)        │
│   Foreground    │                            │
│    Object       │                            │
│   (Cropped)     │                            │
│                 │                            │
└─────────────────┴────────────────────────────┘
```

### Controls & Navigation
- **Class Selection**: Dropdown in top-left showing all available class names from dataset
- **Background Navigation**: Arrow keys or buttons to cycle through background images
- **Foreground Navigation**: Arrow keys or buttons to cycle through available foreground objects of selected class
- **Object Rotation**: 
  - Hold 'F' key: rotate object clockwise (15° increments)
  - Hold 'D' key: rotate object counter-clockwise (15° increments)
- **Object Placement**: Click on background image to paste current foreground object at cursor position

### Foreground Object Display
- Show cropped object image in bottom-left panel
- Display current rotation angle
- Show object dimensions
- Preview of object that will be pasted

### Background Canvas
- Display current background image
- Show cursor crosshair when hovering
- Visual preview of object placement before clicking
- Display existing annotations as overlay (optional toggle)

### Annotation Management
- Automatically generate new COCO annotations when object is pasted:
  - Calculate bounding box coordinates
  - Generate segmentation mask based on object's original mask + rotation
  - Assign unique annotation ID
  - Link to correct category ID and image ID
- Maintain COCO format structure:
  - Keep existing background image metadata
  - Preserve original annotations
  - Add new annotations for pasted objects

### Export Functionality
- Generate new COCO dataset zip containing:
  - Updated annotations.json with all original + new annotations
  - All background images (original)
  - Composite images with pasted objects
- Maintain original COCO dataset structure and naming conventions

## Technical Requirements
- **Frontend**: React with TypeScript
- **Canvas Handling**: HTML5 Canvas for image manipulation and object placement
- **File Processing**: Handle zip file upload/download, JSON parsing
- **Image Processing**: Object rotation, cropping, alpha channel handling for object placement
- **State Management**: Track current selections, annotations, and dataset state

## Key Data Structures
- Original COCO dataset (images, annotations, categories)
- Current UI state (selected class, background index, foreground index, rotation)
- Modified annotations array (original + newly added)
- Foreground object library (organized by class)
