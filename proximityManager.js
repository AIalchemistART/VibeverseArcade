/**
 * Proximity Manager for Circuit Sanctum Arcade
 * Manages interactive object proximity to prevent overlapping interactions
 */

class ProximityManager {
    constructor() {
        // List of interactive objects near the player
        this.nearbyObjects = [];
        // The one object that should be interactive (closest)
        this.activeObject = null;
        // Debug toggle
        this.debugMode = false;
    }

    /**
     * Register an object as being near the player
     * @param {Entity} object - The interactive object
     * @param {number} distance - Distance to the player
     */
    registerNearbyObject(object, distance) {
        // Store the object with its distance
        this.nearbyObjects.push({
            object: object,
            distance: distance
        });
    }

    /**
     * Clear the list of nearby objects (call at start of each update cycle)
     */
    clearNearbyObjects() {
        this.nearbyObjects = [];
        this.activeObject = null;
    }

    /**
     * Process all registered objects and determine which one should be active
     * @returns {Entity} The object that should be active (closest to player)
     */
    determineActiveObject() {
        if (this.nearbyObjects.length === 0) {
            this.activeObject = null;
            return null;
        }

        // Sort by distance (ascending)
        this.nearbyObjects.sort((a, b) => a.distance - b.distance);
        
        // Set the closest object as active
        this.activeObject = this.nearbyObjects[0].object;
        
        if (this.debugMode && this.nearbyObjects.length > 1) {
            console.log(`Proximity Manager: ${this.nearbyObjects.length} objects nearby. Activated: ${this.activeObject.arcadeId || this.activeObject.entityId || 'unknown'} at distance ${this.nearbyObjects[0].distance.toFixed(2)}`);
        }
        
        return this.activeObject;
    }

    /**
     * Check if an object should be allowed to show interaction prompts
     * @param {Entity} object - The object to check
     * @returns {boolean} Whether this object should be interactive
     */
    shouldBeInteractive(object) {
        if (this.nearbyObjects.length <= 1) {
            // If there's only one or no objects, it's always interactive
            return true;
        }
        
        this.determineActiveObject();
        // Only the closest object should be interactive
        return this.activeObject === object;
    }
}

// Create a singleton instance
const proximityManager = new ProximityManager();

export { proximityManager };
