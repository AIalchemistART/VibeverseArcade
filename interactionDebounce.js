/**
 * interactionDebounce.js
 * 
 * A robust global interaction debounce system that prevents multiple windows 
 * from opening when interacting with entities like portals and trophies.
 * This is implemented as a standalone file that can be imported and will
 * immediately patch any window.open calls in the game.
 */

// Create global interaction tracking and debounce
window._globalInteractionState = {
    lastOpenTime: 0,
    isWindowOpening: false,
    openCount: 0,
    lastUrl: null,
    blocked: 0
};

// Store the original window.open function
const originalWindowOpen = window.open;

// Override window.open with our debounced version
window.open = function(url, target, features) {
    console.log(`🚀 Intercepted window.open call for URL: ${url}`);
    
    const now = Date.now();
    const timeSinceLastOpen = now - window._globalInteractionState.lastOpenTime;
    const isAlreadyOpening = window._globalInteractionState.isWindowOpening;
    
    // Block rapid fire window opens with a 3 second cooldown
    if (isAlreadyOpening || timeSinceLastOpen < 3000) {
        console.log(`🛑 BLOCKED window.open - Cooldown active`, {
            timeSinceLastOpen,
            isAlreadyOpening, 
            blockedCount: ++window._globalInteractionState.blocked
        });
        return null;
    }
    
    // Allow the window to open and update state
    console.log(`✅ ALLOWED window.open after ${timeSinceLastOpen}ms cooldown`);
    
    window._globalInteractionState.lastOpenTime = now;
    window._globalInteractionState.isWindowOpening = true;
    window._globalInteractionState.openCount++;
    window._globalInteractionState.lastUrl = url;
    
    // Create a visual feedback element
    const feedback = document.createElement('div');
    feedback.textContent = 'Opening link...';
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    feedback.style.color = '#00ffcc';
    feedback.style.borderRadius = '5px';
    feedback.style.fontFamily = 'monospace';
    feedback.style.fontSize = '16px';
    feedback.style.zIndex = '9999';
    feedback.style.boxShadow = '0 0 10px #00ffcc';
    document.body.appendChild(feedback);
    
    // Open the window and reset state after a delay
    setTimeout(() => {
        try {
            // Call the original window.open
            const result = originalWindowOpen.call(window, url, target, features);
            
            // Clean up after a delay
            setTimeout(() => {
                window._globalInteractionState.isWindowOpening = false;
                if (feedback.parentNode) {
                    document.body.removeChild(feedback);
                }
            }, 1500);
            
            return result;
        } catch (err) {
            console.error('Error opening window:', err);
            window._globalInteractionState.isWindowOpening = false;
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
            return null;
        }
    }, 100);
};

console.log('🔒 Interaction debounce system installed - window.open has been protected');

export const interactionDebounce = {
    // This is just a placeholder export to make the module importable
    // The actual functionality is patched directly onto window.open
    isActive: true
};
