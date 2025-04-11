// Visitor counter function with persistence via KV store
const { getStore } = require('@netlify/blobs');

// Counter key in the KV store
const COUNTER_KEY = 'visitor-counter';

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Get action from query parameters
    const action = event.queryStringParameters?.action || 'hit';
    
    // Initialize KV store
    const store = getStore({
      name: 'visitor-counter-store'
    });
    
    // Get current count from store
    let currentCount;
    try {
      // Try to read the current count
      const data = await store.get(COUNTER_KEY);
      currentCount = data ? parseInt(data, 10) : 500; // Start at 500 if no data
    } catch (error) {
      console.log('Error reading from KV store:', error);
      currentCount = 500; // Default count if read fails
    }
    
    // Increment if this is a 'hit' request
    if (action === 'hit') {
      currentCount++;
      
      // Save the incremented count back to the store
      try {
        await store.set(COUNTER_KEY, currentCount.toString());
        console.log(`Visitor count saved: ${currentCount}`);
      } catch (error) {
        console.error('Failed to save counter:', error);
        // Continue execution even if save fails
      }
    }
    
    // Return the current count
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: currentCount,
        source: 'netlify-kv-counter',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in visitor counter function:', error);
    
    // Fallback count between 500-700 (looks reasonable but not random)
    const fallbackCount = 500 + Math.floor(new Date().getDate() * 7);
    
    return {
      statusCode: 200, // Return 200 even on error to avoid 502
      headers,
      body: JSON.stringify({
        count: fallbackCount,
        source: 'fallback',
        error: 'Counter function error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
