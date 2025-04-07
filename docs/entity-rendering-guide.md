# AI Alchemist's Lair - Entity Rendering Guide

## Overview
This document explains how custom entities are rendered in the game and provides a guide for adding new entities with custom rendering logic.

## How Entity Rendering Works

### The Rendering Pipeline

1. Entities are stored in the game's entity list (`game.entities`)
2. During each frame, the scene renderer iterates through all entities
3. The scene calculates the screen position for each entity using isometric projection
4. The renderer checks if the entity has a custom `draw()` method:
   - If yes: Calls the entity's custom draw method
   - If no: Falls back to a basic 3D rendering for the entity

### Key Classes Involved

- **Scene**: Handles overall scene rendering and manages the rendering pipeline
- **Entity**: Base class for all entities with default properties
- **Game**: Manages entity collection and the main game loop
- **SignEntity**: Example of a custom entity with its own rendering logic

## Custom Entity Implementation

### 1. Custom Entity Creation

To create a custom entity with unique rendering:

```javascript
class CustomEntity extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        
        // Custom properties
        this.customProperty = value;
        
        // Load assets or prepare rendering resources
        this.loadAssets();
    }
    
    // Optional asset loading method
    loadAssets() {
        // Load images, create canvases, etc.
    }
    
    // This is the key method that will be called by the scene renderer
    draw(ctx, screenX, screenY, width, height, zOffset) {
        // Custom drawing logic goes here
        // ctx: Canvas context
        // screenX, screenY: Screen position (already calculated with isometric projection)
        // width, height: Entity dimensions in screen pixels
        // zOffset: Z-axis offset for height/jumping
    }
}
```

### 2. Entity Registration

Add your entity to the game world:

```javascript
// Create the entity
const customEntity = new CustomEntity(x, y, width, height);

// Add to the game
game.addEntity(customEntity);
```

## Common Pitfalls and Solutions

### Issue: Entities Not Rendering

**Problem**: Custom entities exist in the game but aren't visible.

**Solution**: Check the following:
1. Ensure the entity has a proper `draw()` method defined
2. Confirm that assets are loading correctly
3. Verify entity has valid position (x, y) within grid bounds
4. Check entity dimensions (width, height) are reasonable
5. Entities with z-height need proper zHeight property

### Issue: Entity Drawing at Wrong Position

**Problem**: Entity appears but in the wrong location.

**Solution**:
1. The scene handles isometric projection - use provided screenX/screenY
2. Account for entity width/height when positioning elements
3. For centered elements, offset by half width/height

### Issue: Asynchronous Asset Loading

**Problem**: Entity renders as fallback because image isn't loaded yet.

**Solution**:
1. Implement a preloading system for assets
2. Always include fallback rendering for entities with images
3. Use the asset loader system or handle loading states in your draw method

## Custom Rendering Tips

### Isometric Z-Height

For elevation and 3D effects:
```javascript
// Apply z-height offset for elevation (in draw method)
const elevatedY = screenY - zOffset - (this.zHeight * someHeightFactor);
```

### Lighting Effects

For shadows and highlights:
```javascript
// Create lighting variation
ctx.shadowColor = '#000';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;
```

### Cyberpunk Glows

For neon effects:
```javascript
// Neon glow effect
ctx.shadowColor = '#00FFFF';
ctx.shadowBlur = 15;
ctx.strokeStyle = '#00FFFF';
ctx.lineWidth = 2;
ctx.strokeRect(x, y, width, height);
```

## Lessons from the Sign Entity Implementation

The sign entity implementation taught us several important lessons:

1. **Custom Draw Method**: All custom entities must implement a `draw()` method
2. **Asset Loading**: Reliable asset loading requires fallback mechanisms
3. **Scene Rendering Logic**: The scene renderer must check for custom draw methods on all entities, not just the player
4. **Fallback Rendering**: Always implement a fallback render method for entities with external assets
5. **Consistent Dimensions**: Use consistent size units (grid units vs. screen pixels)

## Conclusion

By following these patterns, you can create rich, visually distinct entities that seamlessly integrate with the game's rendering system. Each entity can have its own unique appearance while benefiting from the game's core systems for positioning, collision detection, and lifecycle management.

*Document created: March 30, 2025*
