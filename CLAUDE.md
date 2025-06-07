# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Commands
- **Start development server**: `cd coco-editor && npm start`
- **Build for production**: `cd coco-editor && npm run build`
- **Run tests**: `cd coco-editor && npm test`
- **Run specific test**: `cd coco-editor && npm test -- --testNamePattern="ComponentName"`
- **Type check**: `cd coco-editor && npx tsc --noEmit`

### Code Quality Commands
- **Lint code**: `cd coco-editor && npm run lint`
- **Fix lint issues**: `cd coco-editor && npm run lint:fix`
- **Format code**: `cd coco-editor && npm run format`
- **Check formatting**: `cd coco-editor && npm run format:check`

## Architecture Overview

### State Management
The application uses a centralized state pattern with a single `EditorState` object in App.tsx. State flows down through props and updates flow up through callbacks. Key state includes:
- Loaded COCO dataset (images, annotations, categories)
- UI state (selected class, current indices, rotation)
- Placed objects tracking for export

### Component Responsibilities
- **App.tsx**: Orchestrates global state and layout
- **DatasetUploader**: Handles COCO dataset loading and foreground object extraction from segmentation masks
- **BackgroundCanvas**: Core canvas rendering, object placement, mouse interaction, and preview display
- **ForegroundPanel**: Shows selected object with current rotation
- **NavigationControls**: Background/foreground navigation UI
- **ClassDropdown**: Category selection
- **ExportButton**: Generates new COCO dataset with composited images

### Data Flow Patterns
- **Image Storage**: Uses Maps for efficient lookup (imageMap, foregroundObjectsMap)
- **Annotation Management**: Maintains original annotations and adds new ones for placed objects
- **Canvas Rendering**: Direct canvas API usage with layered rendering (background → objects → preview)
- **COCO Format**: Strict TypeScript interfaces ensure format compliance

### Key Technical Details
- **Foreground Extraction**: Creates masked images from COCO segmentation polygons
- **Object Placement**: Tracks placed objects with position, rotation, and scale
- **Export Pipeline**: Composites objects onto backgrounds and generates updated COCO JSON
- **Rotation Handling**: F/D keys for 15° increment rotation with canvas transform API

## Local Development Assets
- Tiny COCO dataset available at `public/tiny_coco/` for quick testing
- Contains sample train/val images with annotations for multiple object categories
