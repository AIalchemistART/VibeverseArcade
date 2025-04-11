// Simplified Netlify function to ensure it works
exports.handler = async function() {
  // Basic CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  try {
    // Just return a static response for testing
    const staticCount = Math.floor(1000 + Math.random() * 1000); // A random number between 1000-2000
    
    // Return a simple JSON response to confirm function is working
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: staticCount,
        source: 'static-test',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Error',
        message: error.message
      })
    };
  }
};
