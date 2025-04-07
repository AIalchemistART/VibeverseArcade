/**
 * Debug Controls Module
 * Provides keyboard shortcuts and controls for debugging and testing
 */

import { runSceneTests } from './sceneTest.js';

// Flag to track if tests have been run
let testsRun = false;
let testsRunning = false;

/**
 * Initialize debug controls
 */
export function initDebugControls() {
    // Add event listener for keyboard shortcuts
    // L key debug handler disabled for deployment
    // window.addEventListener('keydown', (event) => {
    //     // Run scene tests with L key - DISABLED FOR DEPLOYMENT
    //     if ((event.key === 'l' || event.key === 'L') && !testsRunning) {
    //         // Scene test functionality disabled for deployment
    //     }
    // });
    
    // Auto-run tests functionality disabled for deployment
    // if (window.location.search.includes('test=scene') && !testsRun && !testsRunning) {
    //     // Scene test auto-run disabled for deployment
    // }
}
