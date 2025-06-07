# AGENT.md

## Commands
- **Start dev server**: `cd coco-editor && npm start`
- **Build**: `cd coco-editor && npm run build`
- **Test**: `cd coco-editor && npm test`
- **Test single file**: `cd coco-editor && npm test -- --testNamePattern="ComponentName"`
- **Type check**: `cd coco-editor && npx tsc --noEmit`

## Code Style
- **TypeScript**: Strict mode enabled, use explicit types for props/state
- **React**: Functional components with hooks, React 19 
- **Imports**: Absolute imports from `src/`, React imports first, then types, then components
- **Naming**: PascalCase for components, camelCase for variables/functions, kebab-case for CSS classes
- **Error handling**: Try/catch with console.warn for non-critical errors, alert for user-facing errors
- **State**: Use callback pattern for state updates, useState with explicit types
- **Files**: Component files in `src/components/`, types in `src/types/`
- **CSS**: CSS modules or standard CSS files, BEM-like naming conventions

## Local Dataset
- Tiny COCO dataset available at `../tiny_coco_dataset/tiny_coco/`
- Contains train2017/, val2017/, and annotations/ folders
