# 🚀 AI Alchemist's Lair - Phase 1 Roadmap: Environment & Core Interaction Foundation

## Phase Overview
This document details the specific implementation steps for Phase 1 of the AI Alchemist's Lair project. Phase 1 focuses on establishing the basic environment and core interaction mechanics using HTML, JavaScript, and the Canvas API.

## Technical Approach
- **Rendering**: Canvas API for 2D isometric rendering
- **Architecture**: Modular ES6 JavaScript with separate files for different concerns
- **Input Handling**: Keyboard and mouse event listeners
- **Visual Style**: Simple isometric grid for initial testing

## Implementation Steps

### Step 1: Basic Project Structure
- **Files to Create**:
  - `index.html`: Main HTML document with canvas element
  - `styles.css`: Empty stylesheet for future styling
  - `main.js`: Entry point for JavaScript code
- **Implementation Details**:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Alchemist's Lair</title>
      <link rel="stylesheet" href="styles.css">
  </head>
  <body>
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <script type="module" src="main.js"></script>
  </body>
  </html>
  ```
- **Key Points**:
  - Canvas dimensions set to 800x600 pixels
  - Using ES6 modules with `type="module"` attribute
  - Minimal HTML structure to keep focus on the canvas

### Step 2: Canvas Initialization
- **Files to Modify**:
  - `main.js`: Set up canvas context
- **Implementation Details**:
  ```javascript
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
      throw new Error('Failed to get canvas context. Please check browser support.');
  }
  ```
- **Key Points**:
  - Retrieve canvas element by ID
  - Get 2D rendering context for drawing operations
  - Add error handling for canvas context initialization

### Step 3: Input Handling Module
- **Files to Create**:
  - `input.js`: Module for tracking user input
- **Implementation Details**:
  ```javascript
  const input = {
      keys: {},
      mouse: { x: 0, y: 0, leftClick: false, rightClick: false }
  };
  
  window.addEventListener('keydown', (event) => {
      input.keys[event.key] = true;
  });
  
  window.addEventListener('keyup', (event) => {
      input.keys[event.key] = false;
  });
  
  const canvas = document.getElementById('gameCanvas');
  canvas.addEventListener('mousemove', (event) => {
      input.mouse.x = event.offsetX;
      input.mouse.y = event.offsetY;
  });
  
  canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) input.mouse.leftClick = true;
      if (event.button === 2) input.mouse.rightClick = true;
  });
  
  canvas.addEventListener('mouseup', (event) => {
      if (event.button === 0) input.mouse.leftClick = false;
      if (event.button === 2) input.mouse.rightClick = false;
  });
  
  canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
  });
  
  export { input };
  ```
- **Key Points**:
  - Track keyboard state with `keys` object
  - Monitor mouse position and button states
  - Prevent context menu on right-click
  - Export `input` object for use in other modules

### Step 4: Import Input Module
- **Files to Modify**:
  - `main.js`: Import the input module
- **Implementation Details**:
  ```javascript
  import { input } from './input.js';
  ```
- **Key Points**:
  - Use ES6 import syntax to access the input module
  - Relative path to maintain modularity

### Step 5: Test Scene Module
- **Files to Create**:
  - `scene.js`: Module for rendering the test scene
- **Implementation Details**:
  ```javascript
  class TestScene {
      render(ctx, playerX, playerY) {
          // Draw 10x10 isometric grid
          for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                  const screenX = 400 + (i - j) * 32;
                  const screenY = 300 + (i + j) * 16;
                  ctx.fillStyle = 'gray';
                  ctx.fillRect(screenX, screenY, 10, 10);
              }
          }
          // Draw player
          const playerScreenX = 400 + (playerX - playerY) * 32;
          const playerScreenY = 300 + (playerX + playerY) * 16;
          ctx.fillStyle = 'blue';
          ctx.fillRect(playerScreenX, playerScreenY, 10, 10);
      }
  }
  
  export { TestScene };
  ```
- **Key Points**:
  - Create a simple isometric grid (10x10)
  - Center the grid on the canvas at position (400, 300)
  - Render player as a blue square
  - Use isometric transformation for coordinates

### Step 6: Game Loop Implementation
- **Files to Modify**:
  - `main.js`: Set up game loop and player movement
- **Implementation Details**:
  ```javascript
  import { input } from './input.js';
  import { TestScene } from './scene.js';
  
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
      throw new Error('Failed to get canvas context. Please check browser support.');
  }
  const scene = new TestScene();
  let playerX = 5;
  let playerY = 5;
  
  function gameLoop() {
      // Update player position based on input
      if (input.keys['ArrowLeft']) playerY -= 0.1;
      if (input.keys['ArrowRight']) playerY += 0.1;
      if (input.keys['ArrowUp']) playerX -= 0.1;
      if (input.keys['ArrowDown']) playerX += 0.1;
      playerX = Math.max(0, Math.min(9, playerX));
      playerY = Math.max(0, Math.min(9, playerY));
      
      // Clear canvas
      ctx.clearRect(0, 0, 800, 600);
      
      // Render scene with player position
      scene.render(ctx, playerX, playerY);
      
      requestAnimationFrame(gameLoop);
  }
  
  gameLoop();
  ```
- **Key Points**:
  - Initialize player position in the middle of the grid
  - Update player position based on arrow key input
  - Constrain player movement within grid boundaries
  - Clear canvas between frames
  - Use requestAnimationFrame for smooth animation

### Step 7: Canvas Styling and Presentation
- **Files to Modify**:
  - `styles.css`: Add styling for canvas
- **Implementation Details**:
  ```css
  body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #1a1a1a; /* Dark gray for a medieval undertone */
      background-image: radial-gradient(circle, #333 1px, transparent 1px); /* Subtle grid texture for depth */
      background-size: 20px 20px; /* Spacing for the background grid pattern */
      overflow: hidden; /* Prevent scrollbars */
  }
  
  canvas {
      border: 2px solid #00c3ff; /* Cyberpunk-inspired neon blue border */
      box-shadow: 0 0 15px #00c3ff55, 0 0 30px #00c3ff33; /* Neon glow effect */
      background-color: #111; /* Dark canvas background */
  }
  ```
- **Key Points**:
  - Center the canvas in the viewport
  - Apply medieval-cyberpunk themed styling
  - Add subtle background pattern for depth
  - Apply neon glow effects for the cyberpunk aesthetic

### Step 8: Asset Loading Foundation
- **Files to Create**:
  - `assets.js`: Module for asset management
- **Implementation Details**:
  ```javascript
  class AssetManager {
      constructor() {
          this.images = {};
          this.totalAssets = 0;
          this.loadedAssets = 0;
      }
      
      loadImage(key, src) {
          this.totalAssets++;
          
          return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                  this.images[key] = img;
                  this.loadedAssets++;
                  resolve(img);
              };
              img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
              img.src = src;
          });
      }
      
      getImage(key) {
          return this.images[key];
      }
      
      getLoadProgress() {
          if (this.totalAssets === 0) return 1;
          return this.loadedAssets / this.totalAssets;
      }
  }
  
  export const assetManager = new AssetManager();
  ```
- **Key Points**:
  - Create a simple asset manager for loading and storing images
  - Implement Promise-based loading for async operations
  - Track loading progress for future loading screen implementation
  - Export a singleton instance for use across modules

### Step 9: Testing and Validation
- **Testing Procedures**:
  1. Test basic project structure
     - Verify that HTML loads correctly in the browser
     - Confirm canvas element appears with correct dimensions
  
  2. Test canvas initialization
     - Verify that context is successfully retrieved
     - Confirm that error handling works for unsupported browsers
  
  3. Test input handling
     - Verify keyboard event tracking functions correctly
     - Confirm mouse position updates
     - Test left and right click detection
     - Verify context menu is prevented
  
  4. Test scene rendering
     - Verify isometric grid renders correctly
     - Confirm player square appears in correct position
  
  5. Test game loop
     - Verify player movement with arrow keys
     - Confirm player stays within grid boundaries
     - Check frame rate performance
  
  6. Test styling
     - Verify canvas is centered
     - Confirm cyberpunk styling elements appear correctly
  
  7. Test asset loading
     - Verify the asset manager can load test images
     - Confirm loading progress calculation is accurate

- **Expected Results**:
  - A functional canvas-based environment with a visible isometric grid
  - A blue square representing the player that can be moved with arrow keys
  - Responsive controls with both keyboard and mouse tracking
  - Visually appealing presentation with medieval-cyberpunk theming
  - Foundation for future asset management and features

## Resulting File Structure
```
AI_Alchemist's_Lair/
│
├── index.html             # Main HTML document with canvas
├── styles.css             # CSS styling for the application
├── main.js                # Entry point, game loop, and player movement
├── input.js               # Input handling module
├── scene.js               # Test scene with isometric grid
└── assets.js              # Asset management foundation
```

## Completion Criteria
Phase 1 will be considered complete when:
- All 9 steps are implemented and tested
- The player can navigate the isometric grid with arrow keys
- Input tracking works correctly for both keyboard and mouse
- The visual presentation follows the medieval-cyberpunk theme
- The foundation is in place for asset loading and future expansion

## Notes for Future Development
- Phase 2 will focus on camera systems and controls
- Consider extending the isometric grid into a more complex environment
- Plan for implementing left-click interaction and right-click projectile mechanics
- Begin designing the Grand Ballroom portal system structure

---

*Last updated: March 27, 2025*
