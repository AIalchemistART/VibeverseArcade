/**
 * Debugging Fix - Resolves issues with movement keys and loading screen
 * This is a dedicated fix that resolves the player movement issue
 */

// Wait until everything is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚠️ Movement debug fix loaded');
    
    // Create a debugging panel
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '50px';
    debugPanel.style.right = '10px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = '#00ff00';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '10000';
    debugPanel.style.minWidth = '150px';
    debugPanel.style.maxWidth = '300px';
    debugPanel.innerHTML = `
        <div style="border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold;">Movement Fix</div>
        <div id="debug-status">Waiting for game to load</div>
        <div style="margin-top: 10px;">
            <button id="fix-game-btn" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 3px 8px; cursor: pointer; font-family: monospace;">Fix Movement</button>
            <button id="reset-game-btn" style="background: #333; color: #f00; border: 1px solid #f00; padding: 3px 8px; cursor: pointer; font-family: monospace; margin-left: 5px;">Reset Game</button>
        </div>
    `;
    document.body.appendChild(debugPanel);
    
    // Track if fix has been applied
    let fixApplied = false;
    
    // Add button event listener
    document.getElementById('fix-game-btn').addEventListener('click', () => {
        applyMovementFix();
    });
    
    // Add reset game button listener
    document.getElementById('reset-game-btn').addEventListener('click', () => {
        // Force refresh the page
        window.location.reload();
    });
    
    // Function to apply movement fix
    function applyMovementFix() {
        if (fixApplied) {
            document.getElementById('debug-status').textContent = 'Fix already applied';
            return;
        }
        
        try {
            // Step 1: Reset input state
            if (window.input) {
                console.log('Resetting input state');
                window.input.keys = {};
                window.input.reset();
            }
            
            // Step 2: Check if game and player entity exist
            if (!window.game || !window.game.player) {
                console.log('Game or player not found, attempting to fix reference');
                
                // Try to find game instance from global scope
                let gameInstance = null;
                for (const key in window) {
                    if (window[key] && typeof window[key] === 'object' && window[key].player) {
                        console.log(`Found potential game instance in: ${key}`);
                        gameInstance = window[key];
                        break;
                    }
                }
                
                if (gameInstance) {
                    // Expose it globally for debugging
                    window.game = gameInstance;
                } else {
                    document.getElementById('debug-status').textContent = 'Game not initialized yet. Try again in a moment.';
                    return;
                }
            }
            
            // Step 3: Fix entity update logic
            const player = window.game.player;
            if (player) {
                console.log('Player entity found, applying fix');
                
                // Force player to be movable (not static)
                player.isStatic = false;
                
                // Reset any velocity caps
                player.velocityX = 0;
                player.velocityY = 0;
                
                // Make sure jump state is reset
                player.isJumping = false;
                player.canJump = true;
                
                // Make sure any collision state is cleared
                player.isColliding = false;
                
                // Log the player's properties for debugging
                console.log('Player state after fix:', {
                    x: player.x,
                    y: player.y,
                    isStatic: player.isStatic,
                    velocityX: player.velocityX,
                    velocityY: player.velocityY,
                    speed: player.speed
                });
                
                // Create a test movement to verify functionality
                const testDirections = ['up', 'right', 'down', 'left'];
                let testIndex = 0;
                
                const testMovement = setInterval(() => {
                    if (testIndex >= testDirections.length) {
                        clearInterval(testMovement);
                        console.log('Movement test complete');
                        return;
                    }
                    
                    const direction = testDirections[testIndex];
                    console.log(`Testing movement in direction: ${direction}`);
                    
                    // Apply a test movement in each direction
                    player.move(direction, 0.016);
                    
                    // Debug info
                    console.log(`Direction ${direction} - Position: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})`);
                    
                    testIndex++;
                }, 250);
                
                // Step 4: Fix keyboard event capture for the game
                // Check if the game loop is using input.keys properly
                document.addEventListener('keydown', (e) => {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                        console.log(`Key captured: ${e.key}`);
                        // Force set the key state directly
                        if (window.input) {
                            window.input.keys[e.key] = true;
                        }
                    }
                }, true);
                
                document.addEventListener('keyup', (e) => {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                        // Force set the key state directly
                        if (window.input) {
                            window.input.keys[e.key] = false;
                        }
                    }
                }, true);
                
                fixApplied = true;
                document.getElementById('debug-status').innerHTML = `
                    <span style="color:#0f0">✓ Fix applied!</span><br>
                    <span style="font-size:10px">Try moving with WASD or arrow keys now.</span>
                `;
            } else {
                document.getElementById('debug-status').textContent = 'Player entity not found. Loading may be incomplete.';
            }
        } catch (error) {
            console.error('Error applying movement fix:', error);
            document.getElementById('debug-status').textContent = 'Error: ' + error.message;
        }
    }
    
    // Auto-apply fix when loading completes
    window.addEventListener('loadingComplete', () => {
        // Give a moment for everything to initialize
        setTimeout(() => {
            if (!fixApplied) {
                console.log('Auto-applying movement fix after loading');
                applyMovementFix();
            }
        }, 1000);
    });
    
    // Also check periodically in case the event wasn't fired
    setTimeout(() => {
        if (!fixApplied && window.game && window.game.player) {
            console.log('Auto-applying movement fix (delayed)');
            applyMovementFix();
        }
    }, 5000);
});
