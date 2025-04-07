/**
 * Hit Detection Module
 * Provides functions for detecting object clicks in the canvas
 */

/**
 * Detect if a point hits any object in the provided list
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {Array} objects - The list of objects to check against
 * @returns {Object|null} - The clicked object or null if no hit detected
 */
export function detectHit(x, y, objects) {
    for (const obj of objects) {
        if (x >= obj.position.x && x <= obj.position.x + obj.width &&
            y >= obj.position.y && y <= obj.position.y + obj.height) {
            return obj;
        }
    }
    return null;
}
