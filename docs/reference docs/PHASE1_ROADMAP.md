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
      background-size: 20px 20px;
  }

  #gameCanvas {
      border: 2px solid #00ffcc; /* Neon cyan for a cyberpunk edge */
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.5); /* Neon glow effect */
  }
  ```
- **Key Points**:
  - Use flexbox to center canvas in the viewport
  - Create medieval-cyberpunk aesthetic with dark textured background
  - Add neon cyan border with glow effect for cyberpunk edge
  - Maintain responsive canvas positioning

## Testing Checklist
Upon completing Phase 1 implementation, verify the following:

- [x] Canvas is properly displayed on the page
- [x] Canvas is centered in the viewport
- [x] Canvas has visible border and contrasting background
- [x] Error handling is in place for canvas context initialization
- [x] Isometric grid is rendered and centered
- [x] Player appears on the grid as a blue square
- [x] Arrow keys move the player in the corresponding directions
- [x] Player cannot move outside the grid boundaries
- [x] Animation runs smoothly without flickering

## Next Steps
After successfully implementing Phase 1, prepare for Phase 2: Camera Systems & Controls by:

1. Documenting any issues or challenges encountered
2. Refining the isometric grid rendering if needed
3. Planning the camera control system implementation
4. Considering how to handle different screen resolutions

## Technical Debt Considerations
- The current implementation uses a fixed canvas size (800x600)
- Basic error handling implemented, but could be expanded
- Basic isometric rendering without depth sorting
- Simple styling with limited responsiveness

*This roadmap serves as a technical guide for Phase 1 implementation.*
*Last updated: March 26, 2025*
