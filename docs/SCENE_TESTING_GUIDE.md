# Scene System Testing Guide

## Running the Tests

The scene system tests can be triggered in two ways:

1. **Keyboard Shortcut**: Press the `L` key while the application is running
2. **URL Parameter**: Add `?test=scene` to the end of your URL when loading the application

## What to Expect During Testing

When you run the scene tests, you'll experience the following sequence:

### Visual Feedback in Game Window

1. **Start Room Visual (Test 1)**:
   - Dark blue background with hex grid pattern
   - Cyan glowing border and text
   - Title: "AI Alchemist's Start Room"
   - Interactive objects displayed with visual indicators

2. **Portfolio Room Visual (Test 2)**:
   - Dark purple background with circuit grid pattern
   - Magenta glowing border and text
   - Title: "Portfolio Showcase"
   - Different interactive objects with their own visuals

3. **Object Interaction (Test 3)**:
   - Visual highlight of the interacted object (portfolioItem1)
   - Possible glow effect on the object

4. **Return to Start Room (Test 4)**:
   - Transition back to the hex grid pattern and cyan theme

Throughout the test, a cyan-on-black test indicator will appear at the top of the screen showing which test is currently running.

### Console Output
The browser's developer console (F12 > Console tab) will show detailed output:

```
==== RUNNING SCENE SYSTEM TESTS ====
Test 1: Scene Loading
Current scene: Start Room
Test 2: Scene Transition
Transitioning from Start Room to Portfolio Room...
Entered portfolio room  // From scene.logic.onEnter
Exited start room       // From scene.logic.onExit
Current scene after transition: Portfolio Room
Test 3: Object Interaction
Testing interaction with portfolioItem1...
Interacted with portfolioItem1  // From object.interact()
Test 4: Return Transition
Transitioning back to Start Room...
Entered start room      // From scene.logic.onEnter
Exited portfolio room   // From scene.logic.onExit
Final scene: Start Room
==== SCENE SYSTEM TESTS COMPLETED ====
```

### What's Being Tested

1. **Scene Loading**: Verifies that scenes can be properly loaded and accessed
2. **Scene Transitions**: Tests the directional navigation between connected scenes
3. **Scene Event Hooks**: Validates the onEnter and onExit events for each scene
4. **Object Interactions**: Confirms that objects respond to interaction events
5. **Visual Rendering**: Ensures each scene has its unique visual appearance

## Troubleshooting

If the tests don't work as expected:

1. **No Visual Changes**: Check that the `sceneRenderer.js` is correctly rendering scene-specific visuals
2. **No Console Output**: Ensure you have the browser console open before pressing `L`
3. **Missing Scene Elements**: Check `sceneData.js` to ensure scene definitions are complete
4. **Failed Transitions**: Verify that exits are properly defined with correct directions
5. **No Object Interactions**: Confirm `interactiveObjects.js` is properly integrated

## Next Steps

The scene system tests validate the core functionality of Phase 4. After confirming everything works correctly, you can:

1. Add more scenes to `sceneData.js`
2. Enhance the visual rendering in `sceneRenderer.js`
3. Create more interactive object types
4. Build on this foundation for navigation in your portfolio experience

The medieval-cyberpunk aesthetic and core functionality are now ready for further development as you continue expanding the AI Alchemist's Lair.
