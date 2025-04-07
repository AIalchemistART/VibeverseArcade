# AI Alchemist's Lair - Scene Design Guide

## Introduction
This guide provides information on how to design and implement scenes in the AI Alchemist's Lair game. It covers scene structure, transitions, visual elements, and interactions.

## Scene Data Structure
Each scene in the game is defined in `sceneData.js` with the following properties:

```javascript
{
    id: 'uniqueSceneId',
    name: 'Human-Readable Scene Name',
    description: 'Description of what the scene represents',
    width: 400, // Canvas width units
    height: 300, // Canvas height units
    exits: [
        { 
            direction: 'north', // Compass direction (north, south, east, west)
            to: 'targetSceneId', // ID of the scene to transition to
            position: { x: 200, y: 0 } // Position of the doorway in scene coordinates
        }
        // Additional exits as needed
    ],
    objects: [
        // Interactive objects in the scene
    ],
    logic: {
        onEnter: () => { /* Code executed when entering the scene */ },
        onExit: () => { /* Code executed when exiting the scene */ }
    }
}
```

## Doorways System

### Overview
The game features interactive doorways that allow the player to move between scenes. Doorways are automatically generated at the positions defined in each scene's `exits` array. Each doorway is visually rendered as a glowing portal with direction indicators.

### Doorway Properties
- **Visual Appearance**: Doorways have distinct colors based on their direction:
  - **North**: Cyan (#00ffcc) with an upward arrow (↑)
  - **South**: Blue (#00ccff) with a downward arrow (↓)
  - **East**: Magenta (#ff00cc) with a right arrow (→)
  - **West**: Gold (#ffcc00) with a left arrow (←)

- **Animation**: Doorways feature a pulsating glow effect and display the name of the target scene.

### Adding Doorways to a Scene
To add a doorway to a scene, add an entry to the scene's `exits` array:

```javascript
exits: [
    { 
        direction: 'north', 
        to: 'targetSceneId', 
        position: { x: 200, y: 0 } 
    }
]
```

Where:
- `direction` is one of: 'north', 'south', 'east', 'west'
- `to` is the ID of the target scene to transition to
- `position` contains x and y coordinates in scene coordinates for the doorway placement

### Interaction
Players can transition between scenes by walking into a doorway. When the player character comes within range of a doorway, the game will automatically transition to the target scene.

### Alternative Navigation
In addition to doorways, scene transitions can also be triggered using keyboard shortcuts:
- **Shift+E**: Move east
- **Shift+W**: Move west
- **Shift+N**: Move north
- **Shift+S**: Move south

## Visual Elements
Scenes can include various visual elements:

1. **Background**: Each scene can have a distinct background pattern or color.
2. **Grid**: An isometric grid provides spatial reference and movement guidance.
3. **Interactive Objects**: Objects the player can interact with.
4. **Doorways**: Portals connecting to other scenes.

## Creating New Scenes
To create a new scene:

1. Add a new scene definition to `sceneData.js`
2. Connect it to existing scenes through doorways
3. Add any scene-specific visual elements or logic
4. Test navigation to ensure doorways are working correctly

## Best Practices
- Place doorways at logical positions (edges of rooms, end of corridors)
- Use consistent doorway directions (north exit in one scene should connect to south entrance in another)
- Keep scene dimensions consistent for better navigation
- Add visual cues around doorways to make them more noticeable
- Test all transitions to ensure proper connectivity

## Technical Implementation
The doorway system is implemented across several files:
- `doorways.js`: Contains the Doorway class and DoorwayManager for rendering and collision detection
- `sceneData.js`: Defines exit positions and connections between scenes
- `sceneManager.js`: Handles the actual scene transitions
- `main.js`: Integrates doorway updates and rendering into the game loop
