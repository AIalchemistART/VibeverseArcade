# 🔍 Phase 2: Camera Systems & Controls - Detailed Roadmap

## Overview
Phase 2 builds upon the core foundation established in Phase 1, focusing on creating a robust camera system and enhanced controls. This will enable smooth navigation through the game world and provide a more immersive experience.

## Implementation Steps

### Step 1: Camera Module Foundation
- **Files to Create**:
  - `camera.js`: Core camera functionality
- **Implementation Details**:
  ```javascript
  class Camera {
      constructor() {
          this.x = 0;
          this.y = 0;
          this.width = 800;
          this.height = 600;
      }

      centerOn(playerX, playerY, mapWidth, mapHeight) {
          this.x = playerX - this.width / 2;
          this.y = playerY - this.height / 2;

          // Clamp camera to map boundaries
          if (this.x < 0) this.x = 0;
          if (this.y < 0) this.y = 0;
          if (this.x + this.width > mapWidth) this.x = mapWidth - this.width;
          if (this.y + this.height > mapHeight) this.y = mapHeight - this.height;
      }
  }

  export { Camera };
  ```
- **Key Points**:
  - Create a basic camera class with positioning and boundaries
  - Implement camera centering on player position
  - Add boundary constraints to prevent camera from showing areas outside the map

### Step 2: Camera-Scene Integration
- **Files to Modify**:
  - `scene.js`: Update to work with camera coordinates
  - `main.js`: Import and initialize camera
- **Implementation Details**:
  - Update the scene renderer to account for camera position:
  ```javascript
  // In scene.js
  class TestScene {
      render(ctx, playerX, playerY, camera) {
          const mapWidth = 10 * 64; // Assuming 64x32 grid cells for isometric
          const mapHeight = 10 * 32;

          // Draw 10x10 isometric grid
          for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                  const screenX = (i - j) * 32 - camera.x;
                  const screenY = (i + j) * 16 - camera.y;
                  ctx.fillStyle = 'gray';
                  ctx.fillRect(screenX, screenY, 10, 10);
              }
          }

          // Draw player
          const playerScreenX = (playerX - playerY) * 32 - camera.x;
          const playerScreenY = (playerX + playerY) * 16 - camera.y;
          ctx.fillStyle = 'blue';
          ctx.fillRect(playerScreenX, playerScreenY, 10, 10);
      }
  }
  ```
  - Integrate camera in the main game loop:
  ```javascript
  // In main.js
  import { Camera } from './camera.js';
  
  const camera = new Camera();
  const mapWidth = 10 * 64; // Example map size
  const mapHeight = 10 * 32;
  
  // In the update function
  camera.centerOn(playerX, playerY, mapWidth, mapHeight);
  
  // In the render function
  scene.render(ctx, playerX, playerY, camera);
  ```
- **Key Points**:
  - Maintain separation of concerns between camera logic and scene rendering
  - Ensure smooth coordination between player movement and camera updates

### Step 3: Enhanced Camera Boundary Logic
- **Files to Modify**:
  - `camera.js`: Update boundary handling
- **Implementation Details**:
  ```javascript
  centerOn(playerX, playerY, mapWidth, mapHeight) {
      this.x = playerX - this.width / 2;
      this.y = playerY - this.height / 2;

      // Clamp camera to map boundaries
      if (this.x < 0) this.x = 0;
      if (this.y < 0) this.y = 0;
      if (this.x + this.width > mapWidth) this.x = mapWidth - this.width;
      if (this.y + this.height > mapHeight) this.y = mapHeight - this.height;

      // Center map if smaller than camera
      if (mapWidth < this.width) this.x = (mapWidth - this.width) / 2;
      if (mapHeight < this.height) this.y = (mapHeight - this.height) / 2;
  }
  ```
- **Key Points**:
  - Handle edge cases where map is smaller than the camera viewport
  - Ensure proper centering in all scenarios

### Step 4: Smooth Camera Movement
- **Files to Modify**:
  - `camera.js`: Replace direct positioning with smooth interpolation
- **Implementation Details**:
  ```javascript
  class Camera {
      constructor() {
          this.x = 0;
          this.y = 0;
          this.width = 800;
          this.height = 600;
          this.targetX = 0;
          this.targetY = 0;
      }

      update(playerX, playerY, mapWidth, mapHeight) {
          this.targetX = playerX - this.width / 2;
          this.targetY = playerY - this.height / 2;

          // Clamp target to map boundaries
          if (this.targetX < 0) this.targetX = 0;
          if (this.targetY < 0) this.targetY = 0;
          if (this.targetX + this.width > mapWidth) this.targetX = mapWidth - this.width;
          if (this.targetY + this.height > mapHeight) this.targetY = mapHeight - this.height;

          // Smoothly interpolate
          this.x += (this.targetX - this.x) * 0.1;
          this.y += (this.targetY - this.y) * 0.1;
      }
  }
  ```
- **Key Points**:
  - Implement lerp (linear interpolation) for smooth camera movement
  - Set target position first, then smoothly move toward it
  - Use a smoothing factor to control the camera "lag"

### Step 5: Camera Zoom Functionality
- **Files to Modify**:
  - `camera.js`: Add zoom properties and methods
  - `scene.js`: Modify rendering to handle zoom
- **Implementation Details**:
  ```javascript
  // In camera.js
  class Camera {
      constructor() {
          this.x = 0;
          this.y = 0;
          this.width = 800;
          this.height = 600;
          this.zoom = 1;
      }

      zoomIn() {
          this.zoom *= 1.1;
      }

      zoomOut() {
          this.zoom /= 1.1;
      }
  }

  // In scene.js
  render(ctx, playerX, playerY, camera) {
      ctx.save();
      ctx.scale(camera.zoom, camera.zoom);

      // [rest of rendering code adjusted for zoom]

      ctx.restore();
  }
  ```
- **Key Points**:
  - Implement zoom controls with appropriate scaling factors
  - Update rendering to account for zoom level
  - Use ctx.save() and ctx.restore() to manage transformation state

### Step 6: Camera Zoom Controls
- **Files to Modify**:
  - `main.js`: Add keyboard input handling for zoom
- **Implementation Details**:
  ```javascript
  // In the update function
  if (input.keys['+'] || input.keys['=']) camera.zoomIn();
  if (input.keys['-'] || input.keys['_']) camera.zoomOut();
  ```
- **Key Points**:
  - Map intuitive keys to zoom control functions
  - Keep controls consistent with overall game design

### Step 7: Camera Panning with Middle Mouse
- **Files to Modify**:
  - `input.js`: Add middle-click drag support
  - `camera.js`: Add panning method
  - `main.js`: Connect panning input to camera
- **Implementation Details**:
  ```javascript
  // In input.js
  canvas.addEventListener('mousedown', (event) => {
      if (event.button === 1) { // Middle click
          input.mouse.middleClick = true;
          input.mouse.startDragX = event.offsetX;
          input.mouse.startDragY = event.offsetY;
      }
  });

  // In camera.js
  pan(dx, dy) {
      this.x += dx;
      this.y += dy;
  }

  // In main.js
  if (input.mouse.middleClick) {
      camera.pan(-input.mouse.dragDeltaX, -input.mouse.dragDeltaY);
  }
  ```
- **Key Points**:
  - Implement intuitive panning with middle mouse button
  - Handle proper event tracking for drag operations
  - Ensure panning respects map boundaries

### Step 8: Mini-Map Navigation Aid
- **Files to Create**:
  - `minimap.js`: Implement mini-map functionality
- **Implementation Details**:
  ```javascript
  class MiniMap {
      constructor(mapWidth, mapHeight, canvasWidth, canvasHeight) {
          this.mapWidth = mapWidth;
          this.mapHeight = mapHeight;
          this.width = 100;
          this.height = 100;
          this.scaleX = this.width / mapWidth;
          this.scaleY = this.height / mapHeight;
      }

      render(ctx, playerX, playerY, camera) {
          // Draw mini-map background, player indicator, and camera view
      }
  }

  export { MiniMap };
  ```
- **Key Points**:
  - Create a scaled-down representation of the game world
  - Show player position and current camera viewport
  - Implement as an overlay in the corner of the screen

### Step 9: Rendering Optimization
- **Files to Modify**:
  - `scene.js`: Update rendering logic for performance
- **Implementation Details**:
  ```javascript
  render(ctx, playerX, playerY, camera) {
      // Calculate visible grid cells based on camera position
      const startX = Math.floor(camera.x / 64);
      const startY = Math.floor(camera.y / 32);
      const endX = Math.ceil((camera.x + camera.width) / 64);
      const endY = Math.ceil((camera.y + camera.height) / 32);

      // Only render grid cells that are visible
      for (let i = startX; i <= endX; i++) {
          for (let j = startY; j <= endY; j++) {
              if (i >= 0 && i < 10 && j >= 0 && j < 10) {
                  // Render this cell
              }
          }
      }
  }
  ```
- **Key Points**:
  - Only render elements that are within the camera's view
  - Calculate visible grid range based on camera position
  - Significantly improve performance for larger maps

## Integration with Existing Systems
- Ensure camera works seamlessly with the input system
- Maintain performance with the frame rate limiting system
- Use the asset manager for any camera-related assets
- Leverage error logging for camera system debugging

## Testing Checklist
Upon completing Phase 2 implementation, verify the following:

- [ ] Camera properly follows player movement
- [ ] Camera maintains position within world boundaries
- [ ] Smooth camera movement feels natural and responsive
- [ ] Camera transitions between areas work correctly
- [ ] Zooming in/out functions as expected
- [ ] Navigation indicators provide clear directional guidance
- [ ] Camera system maintains target 60 FPS performance
- [ ] All camera functions properly handle edge cases

## Dependencies
- Input system (from Phase 1)
- Asset management (from Phase 1)
- Error logging (from Phase 1)
- Performance monitoring (from Phase 1)

---

*This roadmap serves as a guide for implementing Phase 2 features. Adjustments may be made during development to address unforeseen challenges or optimize the implementation.*
*Last updated: March 27, 2025*
