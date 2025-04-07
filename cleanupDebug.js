/**
 * Cleanup Script - Removes any debug elements and retains only the fixes
 * This script cleans up debugging UI while preserving the core fixes
 */

// Execute cleanup when document is ready
(function() {
    // Run as soon as possible to clean up UI
    cleanupDebugElements();
    
    // Also run after DOM is fully loaded to catch any late additions
    document.addEventListener('DOMContentLoaded', cleanupDebugElements);
    
    // Function to remove all debug elements
    function cleanupDebugElements() {
        console.log('Performing debug cleanup...');
        
        // List of debug element IDs to look for and remove
        const debugElementIds = [
            'input-diagnostic',
            'debug-panel',
            'movement-fix',
            'fix-game-btn',
            'reset-game-btn',
            'debug-status'
        ];
        
        // Remove elements by ID
        debugElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
                console.log(`Removed debug element: ${id}`);
            }
        });
        
        // Also search for debug elements by class
        const debugClasses = [
            'debug-overlay',
            'debug-control',
            'movement-fix'
        ];
        
        // Remove elements by class
        debugClasses.forEach(className => {
            const elements = document.getElementsByClassName(className);
            // Convert to array as the collection will be modified as we remove elements
            Array.from(elements).forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                    console.log(`Removed debug element with class: ${className}`);
                }
            });
        });
        
        // Look for any elements with "debug" or "fix" in their style
        const allElements = document.querySelectorAll('div');
        allElements.forEach(el => {
            // Check for debug styling indicators
            if (el.style && 
                (el.style.zIndex > 9000 || 
                 (el.id && 
                  (el.id.toLowerCase().includes('debug') || 
                   el.id.toLowerCase().includes('fix') ||
                   el.id.toLowerCase().includes('diagnostic'))) &&
                 // Important: Don't remove loading screen elements!
                 !el.id.toLowerCase().includes('loading'))) {
                
                // Skip essential game elements
                if (el.id === 'gameCanvas' || 
                    el.classList.contains('game-element') || 
                    el.id.includes('loading')) {
                    return;
                }
                
                // Extra safety check: don't mess with loading screen
                const isLoadingRelated = 
                    el.id.includes('loading') || 
                    el.className.includes('loading') ||
                    el.id === 'loadingScreen' ||
                    el.id === 'loadingContainer';
                
                if (isLoadingRelated) {
                    console.log('Preserving loading element:', el.id || 'unnamed');
                    return;
                }
                
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                    console.log('Removed probable debug element:', el.id || 'unnamed');
                }
            }
        });
    }
})();
