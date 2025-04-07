# Circuit Sanctum Arcade - Key Code Manipulations

This document tracks important code manipulations in the project for easy reference.

## Table of Contents
- [Entry Format](#entry-format)
- [World & Environment Settings](#world--environment-settings)
- [Entity Positions](#entity-positions)
- [Portal System](#portal-system)
- [UI & Interaction](#ui--interaction)
- [Game Logic](#game-logic)

## Entry Format
Each entry contains:
- **File**: Source file where the change exists
- **Line**: Approximate line number(s)
- **Search Term**: Two-word search term to locate this code section
- **Description**: Brief explanation of what this code does and why it matters

---

## World & Environment Settings

### Draw Distance Padding
- **File**: scene.js
- **Line**: ~131
- **Search Term**: `padding distance`
- **Description**: Controls how many grid cells outside the visible area are still rendered. Increased from 6 to 12 to improve visual experience by preventing "pop-in" at screen edges.

### Grid Size Configuration
- **File**: scene.js
- **Line**: ~28-30
- **Search Term**: `gridWidth gridHeight`
- **Description**: Controls the overall size of the game world grid. Increased from 20x20 to 80x40 to provide a much larger playable area.

### Player Speed
- **File**: player.js
- **Line**: ~21
- **Search Term**: `player speed`
- **Description**: Increased player movement speed from 3 to 7 to facilitate quicker navigation through the expanded arcade space.

### Player Starting Position
- **File**: main.js
- **Line**: ~63-64
- **Search Term**: `playerX playerY`
- **Description**: { x: 5.5, y: 7 } → { x: 95, y: 35 }, relocated player starting position to the central area of the expanded arcade space.

### Wall Rendering
- **File**: scene.js
- **Line**: ~525, ~537
- **Search Term**: `verticalOffset overlap`
- **Description**: Changed wall tile stacking overlap from 0.7 to 0.95 to create taller, less overlapped walls.

### Wall Sizing
- **File**: isometricRenderer.js
- **Line**: ~113, ~144, ~243
- **Search Term**: `overlapFactor wallHeight`
- **Description**: Modified overlap factors from 1.30 to 0.92 for standard walls and from 1.5 to 2.0 for special walls to adjust the visual appearance of wall heights.

---

## Entity Positions

### Format for Entity Entries
```
### [EntityName] Position
- **File**: [specific file containing the entity]
- **Line**: [line number(s)]
- **Search Term**: `[entityName] position`
- **Description**: [original position] → [new position], [reason for change]
```

<!-- Individual entity position changes will be logged here in alphabetical order -->

### ENTER VIBEVERSE Portal Position
- **File**: main.js
- **Line**: ~173
- **Search Term**: `ENTER VIBEVERSE`
- **Description**: { x: 19, y: 19, z: 0 } → { x: 114.9, y: 37, z: 0 }, relocated to far eastern side of the expanded arcade space for better visibility.

### RETURN Portal Position
- **File**: main.js
- **Line**: ~166
- **Search Term**: `RETURN PORTAL`
- **Description**: { x: 1, y: 19, z: 0 } → { x: 85, y: 36.5, z: 0 }, relocated to central-west area of the expanded arcade space.

### Rug Position
- **File**: rugManager.js
- **Line**: ~72
- **Search Term**: `rug position`
- **Description**: { x: 10, y: 10, z: -0.1 } → { x: 100, y: 40, z: -0.1 }, relocated to center of the expanded arcade area.

### Multiple Rug Implementations
- **File**: rugEntity2.js, rugManager2.js, rugEntity3.js, rugManager3.js, main.js
- **Line**: ~1-215 (rugEntity2/3.js), ~1-90 (rugManager2/3.js), ~25-215 (main.js)
- **Search Term**: `RugEntity2 RugManager2 RugEntity3 RugManager3`
- **Description**: Added multiple decorative rugs to the arcade floor using different textures (Rug_2.png, Rug_3.png). Created unique class implementations with custom sizes (RugEntity2: 19×19, RugEntity3: 18×18) and different positions (second rug: { x: 71, y: 13, z: -0.1 }, third rug: { x: 50, y: 25, z: -0.1 }). This adds visual variety to the floor decorations throughout the expanded arcade space.

### Rug Size
- **File**: rugEntity.js
- **Line**: ~27-28
- **Search Term**: `rug width`
- **Description**: Width/height increased from 5.0x5.0 to 20.0x20.0 to cover a much larger area in the expanded arcade.

### Trophy Position
- **File**: trophyManager.js
- **Line**: ~94
- **Search Term**: `trophy position`
- **Description**: { x: 18.5, y: 8, z: 0 } → { x: 109.1, y: 44.6, z: 0 }, relocated trophy to the northeastern section of the expanded arcade.

### Sign Implementations
- **File**: signManager.js, signEntity2.js, signManager2.js, signEntity3.js, signManager3.js, signEntity4.js, signManager4.js, signEntity5.js, signManager5.js, signEntity6.js, signManager6.js
- **Line**: ~55-56 (signManager.js), ~1-359 (signEntity2.js), ~1-93 (signManager2.js), ~1-359 (signEntity3.js), ~1-93 (signManager3.js), ~1-361 (signEntity4.js), ~1-111 (signManager4.js), ~1-361 (signEntity5.js), ~1-111 (signManager5.js), ~1-361 (signEntity6.js), ~1-111 (signManager6.js)
- **Search Term**: `signX signY ceiling collidable arcade`
- **Description**: Enhanced sign system with multiple sign types: 
  1. Wall-mounted sign at { x: 96.5, y: 1.5 } (original sign)
  2. "ARCADE GAMES" ceiling sign at { x: 60, y: 25, z: 60 } using Sign_2.png asset
  3. "ACTION GAMES" ceiling sign at { x: 115, y: 8, z: 60 } using Sign_3.png asset
  4. Ceiling sign at { x: 97, y: 33 } using Sign_4.png asset
  5. Ceiling sign at { x: 128, y: 38 } using Sign_5.png asset
  6. Ceiling sign at { x: 85, y: 34 } using Sign_6.png asset
  All ceiling signs have `collidable: false` to allow player to walk freely beneath them without collision detection, and are displayed without mounting chains for a cleaner visual appearance.

### X Portal Position
- **File**: xPortalManager.js
- **Line**: ~94
- **Search Term**: `portal position`
- **Description**: { x: 100, y: 45, z: 0 } → { x: 103, y: 55, z: 0 }, adjusted position to northern area of the expanded arcade space.

---

## Portal System

### Door Position - North Wall
- **File**: scene.js, sceneData.js
- **Line**: ~38 (scene.js), ~20 (sceneData.js)
- **Search Term**: `north doorPosition`
- **Description**: Changed north wall door position from 8 to 93, repositioning it to the far right side of the expanded north wall.

### Door Rendering Enhancement
- **File**: isometricRenderer.js
- **Line**: ~240-285
- **Search Term**: `renderDoorway overlapFactor`
- **Description**: Enhanced door visibility by first increasing size multipliers (4.5x height, 2.25x overlap), then further refining to more extreme values (6.5x height, 0.9x overlap) for better visibility over wall tiles.

### North Door - External URL Navigation
- **File**: sceneData.js, portalSystem.js
- **Line**: ~15-21 (sceneData.js), ~29-52 & ~124-138 (portalSystem.js)
- **Search Term**: `externalUrl north`
- **Description**: Modified the north door to navigate to an external URL instead of an internal scene by: 1) Changing destination from 'circuitSanctum' to 'externalUrl' and adding 'externalUrl: https://aialchemistart.github.io/AIalchemistsLAIR/' property in sceneData.js, 2) Updating portalSystem.js to handle external URL transitions with setTimeout delay for smooth transition. This connects the arcade to the original AI Alchemist's Lair project.

### West Door - Removed
- **File**: sceneData.js, scene.js
- **Line**: ~23-30 (sceneData.js), ~695-785 (scene.js)
- **Search Term**: `east comingSoon` / `drawWestWallRow`
- **Description**: Completely removed the west wall door by: 1) Removing its entry from the startRoom scene in sceneData.js, and 2) Modifying the drawWestWallRow method in scene.js to always render standard wall tiles instead of door graphics, creating a continuous west wall without any doorways.

### Coming Soon Sounds - Disabled
- **File**: doorways.js
- **Line**: ~520-530
- **Search Term**: `playComingSoonSound`
- **Description**: Disabled the Coming Soon sound effect system by modifying the playComingSoonSound() function to immediately return, preventing any audio from playing when approaching doors with 'comingSoon' flags.

---

## UI & Interaction

### Arcade Cabinet 2 Game Selection
- **File**: arcadeEntity2.js, arcadeManager2.js
- **Line**: ~60-70 (arcadeEntity2.js), ~135-145 (arcadeManager2.js)
- **Search Term**: `Gnome Mercy`
- **Description**: Modified the second arcade cabinet to showcase only the "Gnome Mercy" game instead of multiple games. Updated the game selection interface to use a 4:3 aspect ratio for the image and streamlined the interface by removing extraneous text elements, focusing on the game image and a pulsing "PRESS ENTER TO PLAY" prompt.

### Arcade Cabinet 2 Image Display
- **File**: arcadeEntity2.js
- **Line**: ~1900-1950
- **Search Term**: `gameImageWidth gameImageHeight`
- **Description**: Enhanced the game image display in the second arcade cabinet to fill most of the menu space with proper 4:3 aspect ratio, improving visual appeal for the single-game cabinet.

### Arcade Cabinet 2 Click Handling
- **File**: arcadeEntity2.js
- **Line**: ~2265-2310
- **Search Term**: `handleMenuClick`
- **Description**: Added click handling functionality to the menu overlay with proper event listeners and coordinate transformation, enabling interactive elements in the game selection interface.

### Room Label
- **File**: scene.js
- **Line**: ~935-943
- **Search Term**: `drawIsometricLabel circuitGridX`
- **Description**: Changed room label from 'CIRCUIT SANCTUM' to 'AI ALCHEMIST\'S LAIR' and repositioned from { x: -18.7, y: -15.2 } → { x: 107.5, y: 26 } to match the expanded layout.

---

## Game Logic

### TV Entity YouTube Integration
- **File**: tvEntity.js
- **Line**: ~85-95, ~530-650
- **Search Term**: `youtubeIframeHTML createYoutubeModal` `randomStartIndex`
- **Description**: Enhanced the TV Entity to display a YouTube playlist with comprehensive shuffle functionality across all 29 videos when activated. Key improvements include:
  1. Updated the YouTube iframe embed URL to use proper shuffle parameters with `listType=playlist` and `shuffle=1`
  2. Implemented full playlist range with random starting index from all 29 videos: `randomStartIndex = Math.floor(Math.random() * 29) + 1`
  3. Added dedicated shuffle button with neon cyan styling matching the TV's aesthetic
  4. Implemented visual feedback with color changes and temporary text updates when shuffle is activated
  5. Fixed modal close button (X) by reorganizing DOM elements to prevent event handler overwriting
  6. These enhancements create a more dynamic and interactive TV experience with manual control over playlist shuffling across the entire content library

### Entity Size and Position Adjustments
- **File**: Multiple entity files (couch, couch2, jukebox, arcade)
- **Line**: Various
- **Search Term**: `width height position`
- **Description**: Modified sizes and positions of various entities to better fit the expanded arcade space:
  1. Couch entities increased from 1.69×2.81 to 3.38×5.62 for better visibility
  2. Couch positions adjusted to { x: 104, y: 32 } and { x: 104, y: 43 }
  3. Jukebox size increased to 6×6 (from 1×1) and repositioned to { x: 88, y: 42 }
  4. Arcade cabinets resized by increasing scale from 0.55 to 0.77 and repositioned to { x: 135.95, y: 19 }
  These adjustments create a more proportional and visually balanced environment in the large arcade space.

### ArcadeEntity2 Proximity Detection Fix
- **File**: game.js
- **Line**: ~412-415
- **Search Term**: `entity.constructor.name ArcadeEntity2`
- **Description**: Added `'ArcadeEntity2'` to the list of interactive entity types in the game's update loop. This critical fix ensures that the second arcade cabinet receives the player reference during updates, enabling proper proximity detection for the "Press Enter" prompt. Without this addition, the second arcade cabinet couldn't detect when the player was nearby because the update method wasn't receiving the player object needed for proximity calculations.

### Jukebox SoundCloud Player Enhancements
- **File**: jukeboxEntity.js
- **Line**: ~500-700
- **Search Term**: `SoundCloud iframe`, `Widget API`, `control buttons`
- **Description**: Enhanced the SoundCloud player with comprehensive music controls and improved autoplay/shuffle functionality:
  1. Integrated SoundCloud Widget API for programmatic control of the player
  2. Implemented reliable autoplay with multiple fallback mechanisms to ensure music starts playing immediately
  3. Added track navigation controls with consistent neon styling:
     - Previous Track button (⏮️) - jumps to the previous track in the playlist
     - Shuffle button (🔀) - randomizes playlist order and jumps to a random track
     - Next Track button (⏭️) - jumps to the next track in the playlist
  4. Added visual feedback for button interactions with hover effects and temporary text changes
  5. Enhanced reliability with proper event handling for track completion events
  These changes create a fully interactive music experience with DJ-like controls, allowing arcade visitors to customize their music experience.

---

*Last updated: April 5, 2025*
