# COCO Dataset Editor

A web-based tool for creating and editing COCO format datasets with an intuitive visual interface. This editor allows you to place object instances from one image onto background images, automatically generating COCO-compliant annotations.

![COCO Dataset Editor Interface](docs/images/coco-editor-screenshot.png)

## Features

- **Visual Object Placement**: Click to place foreground objects onto background images
- **Real-time Preview**: See object placement with transparency before committing
- **Rotation Support**: Rotate objects using keyboard controls (F/D keys)
- **COCO Format Compliance**: Generates proper COCO JSON annotations with segmentation masks
- **Class Selection**: Filter objects by category/class
- **Navigation Controls**: Easy navigation through background and foreground images
- **Export Functionality**: Export your edited dataset in COCO format
- **Tiny COCO Support**: Includes a small subset of COCO for quick testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/synthetic-coco-editor.git
cd synthetic-coco-editor/coco-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Quick Start with Tiny COCO

The editor includes a tiny subset of the COCO dataset for testing:
1. Click "Use Local Tiny COCO" to load the sample dataset
2. Select an object class from the dropdown (e.g., "bird", "person", "motorcycle")
3. Navigate through background images using the Previous/Next buttons
4. Select a foreground object to place
5. Click on the background image to place the object
6. Use F/D keys to rotate the object before placing
7. Export your annotations when done

### Using Your Own Dataset

1. Click "Upload COCO Dataset"
2. Select your dataset folder containing:
   - `train2017/` or `val2017/` folders with images
   - `annotations/` folder with COCO JSON files
3. The editor will load your dataset and allow editing

### Controls

- **Mouse Click**: Place object at cursor position
- **F Key**: Rotate object clockwise (15° increments)
- **D Key**: Rotate object counter-clockwise (15° increments)
- **Previous/Next**: Navigate through images
- **Export**: Download modified annotations

## Interface Overview

The editor interface consists of three main areas:

1. **Left Panel**: 
   - Object class selection
   - Navigation controls for background/foreground images
   - Current object preview with metadata

2. **Center Canvas**: 
   - Main editing area
   - Shows current background image
   - Interactive object placement with crosshair guide

3. **Top Bar**: 
   - Dataset loading options
   - Export functionality

## Technical Details

### Architecture

- **Frontend**: React with TypeScript
- **Canvas Rendering**: HTML5 Canvas API
- **State Management**: React hooks
- **Styling**: CSS with responsive design

### COCO Annotation Format

The editor generates standard COCO annotations including:
- Bounding boxes
- Segmentation masks (polygon format)
- Category IDs
- Image associations
- Area calculations

### Key Components

- `BackgroundCanvas`: Main editing canvas with object rendering
- `ForegroundPanel`: Object selection and preview
- `NavigationControls`: Image navigation
- `DatasetUploader`: COCO dataset loading
- `ExportButton`: Annotation export functionality

## Development

### Available Scripts

- `npm start`: Run development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App (one-way operation)

### Project Structure

```
coco-editor/
├── public/
│   └── tiny_coco/          # Sample dataset
├── src/
│   ├── components/         # React components
│   ├── types/             # TypeScript definitions
│   ├── App.tsx           # Main application
│   └── App.css          # Styles
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Create React App
- Uses the COCO dataset format
- Inspired by the need for synthetic dataset generation tools
