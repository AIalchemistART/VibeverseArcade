/**
 * Path resolver for AI Alchemist's Lair
 * Handles different path prefixes for local development vs GitHub Pages deployment
 */

// Helper function to handle base path for GitHub Pages deployment
function getAssetPath(path) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // ONLY GitHub Pages needs the repo prefix
        // Custom domain and localhost should use paths as-is
        const isGitHubPages = hostname.includes('github.io');
        
        // Log for debugging purposes
        console.log(`PathResolver: Processing '${path}' on hostname: ${hostname}, GitHub Pages: ${isGitHubPages}`);
        
        // Only apply prefix for GitHub Pages, not for custom domain or localhost
        if (isGitHubPages && !path.startsWith('/AIalchemistsLAIR/')) {
            // If path already has a leading slash, remove it before adding the prefix
            if (path.startsWith('/')) {
                path = path.substring(1);
            }
            const result = `/AIalchemistsLAIR/${path}`;
            console.log(`PathResolver: Prefixing path to: ${result}`);
            return result;
        }
    }
    
    return path;
}

// Export the helper function
export { getAssetPath };
