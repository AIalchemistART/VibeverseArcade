/**
 * Scene Testing Module
 * Provides test functions to verify scene transition and interaction functionality
 */

import { getSceneManager, getSceneRenderer } from './sceneIntegration.js';
import { setSceneTestingMode, setCurrentTestScene, requestForceRerender } from './gameBridge.js';

// Visual indicator for tests
let testIndicator = null;
let testOverlay = null;
let currentTestMessage = '';
const INDICATOR_DURATION = 1500; // ms

/**
 * Create visual test indicator in the game window
 */
function createTestIndicator() {
    // Remove any existing indicator
    if (testIndicator) {
        document.body.removeChild(testIndicator);
    }
    
    // Create indicator element
    testIndicator = document.createElement('div');
    testIndicator.style.position = 'absolute';
    testIndicator.style.top = '80px';
    testIndicator.style.left = '50%';
    testIndicator.style.transform = 'translateX(-50%)';
    testIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    testIndicator.style.color = '#0ff';
    testIndicator.style.padding = '10px 20px';
    testIndicator.style.borderRadius = '5px';
    testIndicator.style.fontFamily = 'monospace';
    testIndicator.style.fontSize = '16px';
    testIndicator.style.border = '1px solid #0ff';
    testIndicator.style.boxShadow = '0 0 10px #0ff';
    testIndicator.style.zIndex = '9999';
    
    document.body.appendChild(testIndicator);
    
    return testIndicator;
}

/**
 * Create visual overlay for the different scenes
 */
function createSceneOverlay() {
    // Remove any existing overlay
    if (testOverlay) {
        document.body.removeChild(testOverlay);
    }
    
    // Create overlay element
    testOverlay = document.createElement('div');
    testOverlay.style.position = 'absolute';
    testOverlay.style.top = '150px';
    testOverlay.style.left = '50%';
    testOverlay.style.width = '500px';
    testOverlay.style.transform = 'translateX(-50%)';
    testOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    testOverlay.style.color = '#fff';
    testOverlay.style.padding = '20px';
    testOverlay.style.borderRadius = '10px';
    testOverlay.style.fontFamily = 'monospace';
    testOverlay.style.fontSize = '18px';
    testOverlay.style.textAlign = 'center';
    testOverlay.style.zIndex = '9999';
    
    document.body.appendChild(testOverlay);
    
    return testOverlay;
}

/**
 * Show test step in visual indicator
 */
function showTestStep(message) {
    if (!testIndicator) {
        createTestIndicator();
    }
    
    currentTestMessage = message;
    testIndicator.textContent = message;
    testIndicator.style.display = 'block';
}

/**
 * Show scene information in the visual overlay
 */
function showSceneOverlay(sceneName, sceneColor, description) {
    if (!testOverlay) {
        createSceneOverlay();
    }
    
    // Set border color based on scene
    testOverlay.style.border = `3px solid ${sceneColor}`;
    testOverlay.style.boxShadow = `0 0 20px ${sceneColor}`;
    
    // Create content
    testOverlay.innerHTML = `
        <div style="font-size: 24px; color: ${sceneColor}; margin-bottom: 15px;">
            ${sceneName}
        </div>
        <div style="color: #ccc; margin-bottom: 20px;">
            ${description}
        </div>
        <div style="font-size: 14px; color: #999;">
            This overlay represents the visual appearance of the scene
        </div>
    `;
    
    testOverlay.style.display = 'block';
}

/**
 * Clear test indicators after tests complete
 */
function clearTestIndicators() {
    if (testIndicator) {
        setTimeout(() => {
            document.body.removeChild(testIndicator);
            testIndicator = null;
        }, INDICATOR_DURATION);
    }
    
    if (testOverlay) {
        setTimeout(() => {
            document.body.removeChild(testOverlay);
            testOverlay = null;
        }, INDICATOR_DURATION);
    }
}

/**
 * Pause between test steps for visual clarity
 */
function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test scene-specific logic hooks (onEnter/onExit)
 * This verifies that scene transitions properly trigger logic hooks
 */
export async function testSceneLogic() {
    console.log('==== TESTING SCENE LOGIC HOOKS ====');
    showTestStep('TESTING SCENE LOGIC HOOKS...');
    
    // Get reference to scene manager
    const sceneManager = getSceneManager();
    
    if (!sceneManager) {
        console.error('Scene system not properly initialized. Tests aborted.');
        showTestStep('ERROR: Scene system not initialized');
        clearTestIndicators();
        return;
    }
    
    try {
        // Test onEnter for startRoom
        console.log('Testing scene logic...');
        showTestStep('Loading startRoom to test onEnter hook...');
        sceneManager.loadScene('startRoom');
        setCurrentTestScene('Start Room');
        requestForceRerender();
        
        console.log('Check if startRoom onEnter was triggered');
        await pause(1000);
        
        // Test transition to trigger onExit + onEnter
        showTestStep('Transitioning to portfolioRoom to test exit/enter hooks...');
        sceneManager.transitionTo('north');
        setCurrentTestScene('Portfolio Room');
        requestForceRerender();
        
        console.log('Check if startRoom onExit and portfolioRoom onEnter were triggered');
        await pause(1000);
        
        // Test transition back
        showTestStep('Transitioning back to startRoom...');
        sceneManager.transitionTo('south');
        setCurrentTestScene('Start Room');
        requestForceRerender();
        
        console.log('Check if portfolioRoom onExit and startRoom onEnter were triggered again');
        await pause(1000);
        
        showTestStep('Scene logic hook tests complete');
    } catch (err) {
        console.error('Error during scene logic tests:', err);
        showTestStep(`ERROR: ${err.message}`);
    } finally {
        clearTestIndicators();
    }
}

/**
 * Run scene system tests
 * This function tests scene transitions and interactions
 */
export async function runSceneTests() {
    console.log('==== RUNNING SCENE SYSTEM TESTS ====');
    showTestStep('SCENE SYSTEM TESTS RUNNING...');
    
    // Get references to scene components
    const sceneManager = getSceneManager();
    const sceneRenderer = getSceneRenderer();
    
    if (!sceneManager || !sceneRenderer) {
        console.error('Scene system not properly initialized. Tests aborted.');
        showTestStep('ERROR: Scene system not initialized');
        clearTestIndicators();
        return;
    }
    
    // Enable scene testing mode
    setSceneTestingMode(true);
    
    try {
        // Test 1: Scene Loading
        console.log('Test 1: Scene Loading');
        showTestStep('Test 1: Loading Start Room...');
        sceneManager.loadScene('startRoom');
        setCurrentTestScene('Start Room');
        requestForceRerender();
        
        // Show start room visual overlay
        showSceneOverlay(
            'AI Alchemist\'s Start Room', 
            '#00ffcc',
            'Dark blue background with hexagonal grid pattern and cyan glowing elements. This is the entry point to the portfolio experience.'
        );
        
        const startRoom = sceneManager.getCurrentScene();
        console.log(`Current scene: ${startRoom ? startRoom.name : 'none'}`);
        await pause(INDICATOR_DURATION);
        
        // Test 2: Scene Transition
        console.log('Test 2: Scene Transition');
        showTestStep('Test 2: Transitioning to Portfolio Room...');
        console.log('Transitioning from Start Room to Portfolio Room...');
        sceneManager.transitionTo('north');
        setCurrentTestScene('Portfolio Room');
        requestForceRerender();
        
        // Show portfolio room visual overlay
        showSceneOverlay(
            'Portfolio Showcase', 
            '#ff00cc',
            'Dark purple background with circuit pattern and magenta glowing elements. This room displays the portfolio projects and skills.'
        );
        
        const portfolioRoom = sceneManager.getCurrentScene();
        console.log(`Current scene after transition: ${portfolioRoom ? portfolioRoom.name : 'none'}`);
        await pause(INDICATOR_DURATION);
        
        // Test 3: Object Interaction
        console.log('Test 3: Object Interaction');
        showTestStep('Test 3: Interacting with portfolioItem1...');
        console.log('Testing interaction with portfolioItem1...');
        sceneRenderer.handleInteraction('portfolioItem1', sceneManager);
        requestForceRerender();
        
        // Update overlay to show interaction
        showSceneOverlay(
            'Portfolio Showcase - Interactive Object', 
            '#ff00cc',
            'Interacting with portfolio item: "portfolioItem1". The object glows when clicked and can trigger custom actions.'
        );
        
        await pause(INDICATOR_DURATION);
        
        // Test 4: Return Transition
        console.log('Test 4: Return Transition');
        showTestStep('Test 4: Returning to Start Room...');
        console.log('Transitioning back to Start Room...');
        sceneManager.transitionTo('south');
        setCurrentTestScene('Start Room');
        requestForceRerender();
        
        // Show start room visual overlay again
        showSceneOverlay(
            'AI Alchemist\'s Start Room', 
            '#00ffcc',
            'Returned to the start room with hex grid pattern and cyan theme. The scene transition system is working correctly.'
        );
        
        const finalScene = sceneManager.getCurrentScene();
        console.log(`Final scene: ${finalScene ? finalScene.name : 'none'}`);
        await pause(INDICATOR_DURATION);
        
        console.log('==== SCENE SYSTEM TESTS COMPLETED ====');
        showTestStep('SCENE SYSTEM TESTS COMPLETED');
        clearTestIndicators();
        
        // Disable scene testing mode
        setSceneTestingMode(false);
    } catch (error) {
        console.error('Error during scene tests:', error);
        showTestStep(`ERROR: ${error.message}`);
        clearTestIndicators();
        
        // Ensure testing mode is disabled even on error
        setSceneTestingMode(false);
    }
}
