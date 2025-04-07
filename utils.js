/**
 * Utility functions for AI Alchemist's Lair
 * Provides common utilities like logging and error handling
 */

// Log levels with corresponding colors
const LOG_LEVELS = {
    DEBUG: { name: 'DEBUG', color: '#8a8a8a', enabled: true },
    INFO: { name: 'INFO', color: '#00ffcc', enabled: true },   // Neon cyan for medieval-cyberpunk theme
    WARN: { name: 'WARN', color: '#ffcc00', enabled: true },
    ERROR: { name: 'ERROR', color: '#ff3366', enabled: true }
};

// Default log configuration
const LOG_CONFIG = {
    showTimestamp: true,
    showLevel: true,
    logToConsole: true,
    logToStorage: false,  // For future implementation of log storage
    maxStorageLogs: 100,  // For future implementation
};

/**
 * Creates a formatted log message
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} message - Main log message
 * @param {any} data - Optional data to include with the log
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, message, data) {
    const logLevel = LOG_LEVELS[level];
    let formattedMessage = '';
    
    // Add timestamp if enabled
    if (LOG_CONFIG.showTimestamp) {
        const now = new Date();
        formattedMessage += `[${now.toISOString()}] `;
    }
    
    // Add log level if enabled
    if (LOG_CONFIG.showLevel && logLevel) {
        formattedMessage += `[${logLevel.name}] `;
    }
    
    // Add message
    formattedMessage += message;
    
    return formattedMessage;
}

/**
 * Log a message at the specified level
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} message - Message to log
 * @param {any} data - Optional data to include
 */
function log(level, message, data = null) {
    const logLevel = LOG_LEVELS[level];
    
    // Skip if this log level is disabled
    if (!logLevel || !logLevel.enabled) return;
    
    const formattedMessage = formatLogMessage(level, message, data);
    
    // Log to console if enabled
    if (LOG_CONFIG.logToConsole) {
        const consoleStyled = `%c${formattedMessage}`;
        const styles = `color: ${logLevel.color}; font-weight: bold;`;
        
        switch (level) {
            case 'DEBUG':
                console.debug(consoleStyled, styles, data ? data : '');
                break;
            case 'INFO':
                console.info(consoleStyled, styles, data ? data : '');
                break;
            case 'WARN':
                console.warn(consoleStyled, styles, data ? data : '');
                break;
            case 'ERROR':
                console.error(consoleStyled, styles, data ? data : '');
                break;
            default:
                console.log(consoleStyled, styles, data ? data : '');
        }
    }
    
    // Future implementation: Log to storage
    if (LOG_CONFIG.logToStorage) {
        // Store logs for later retrieval or send to a server
    }
}

/**
 * Log a debug message
 * @param {string} message - Message to log
 * @param {any} data - Optional data to include
 */
function debug(message, data = null) {
    log('DEBUG', message, data);
}

/**
 * Log an info message
 * @param {string} message - Message to log
 * @param {any} data - Optional data to include
 */
function info(message, data = null) {
    log('INFO', message, data);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 * @param {any} data - Optional data to include
 */
function warn(message, data = null) {
    log('WARN', message, data);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 * @param {any} data - Optional data to include
 */
function error(message, data = null) {
    log('ERROR', message, data);
}

/**
 * Enable or disable a specific log level
 * @param {string} level - Log level to configure (DEBUG, INFO, WARN, ERROR, or ALL)
 * @param {boolean} enabled - Whether to enable or disable the level
 */
function setLogLevelEnabled(level, enabled) {
    if (level === 'ALL') {
        // Set all levels
        Object.keys(LOG_LEVELS).forEach(key => {
            LOG_LEVELS[key].enabled = enabled;
        });
        info(`All log levels ${enabled ? 'enabled' : 'disabled'}`);
    } else if (LOG_LEVELS[level]) {
        LOG_LEVELS[level].enabled = enabled;
        info(`Log level ${level} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
        warn(`Unknown log level: ${level}`);
    }
}

/**
 * Configure logging options
 * @param {Object} config - Configuration options
 */
function configureLogging(config) {
    Object.assign(LOG_CONFIG, config);
    info('Logging configuration updated', LOG_CONFIG);
}

export {
    debug,
    info,
    warn,
    error,
    setLogLevelEnabled,
    configureLogging,
    LOG_LEVELS,
    LOG_CONFIG
};
