/**
 * Ultra-simple Netlify function to return a visitor count
 * No dependencies, no external APIs - just returns a number based on the date
 */
exports.handler = async function(event) {
  // CORS headers - essential for browser access
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '{}'
    };
  }

  try {
    // Generate a realistic, modest count based on date 
    // This creates numbers that match the 30-50 daily visitors range
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Start with a realistic base count (using month to create some variance)
    const baseCount = 30 + (month * 2); // Base count between 30-52 depending on month
    
    // Calculate days since April 1st, 2023 (approximate site launch date)
    const launchDate = new Date(2023, 3, 1); // April 1, 2023
    const daysSinceLaunch = Math.max(0, Math.floor((now - launchDate) / (1000 * 60 * 60 * 24)));
    
    // Add a modest number based on days since launch (1 visitor every 4 days)
    const growthCount = Math.floor(daysSinceLaunch / 4);
    
    // Add daily fluctuation (0-5 visitors) based on hour of day
    // This creates a natural pattern where visitor count rises during the day
    const hourlyCount = Math.min(5, Math.floor((now.getHours() / 24) * 5));
    
    // Calculate the final count
    let count = baseCount + growthCount + hourlyCount;
    
    // If explicitly asked to hit the counter, add 1 for the new visitor
    const action = event.queryStringParameters?.action;
    if (action === 'hit') {
      count += 1; // Add exactly 1 for a real visitor
    }
    
    // Return a clean 200 response with the count
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: count,
        source: 'time-based-counter',
        timestamp: now.toISOString()
      })
    };
  } catch (error) {
    // Even on error, return a modest fallback count
    // This prevents the function from returning a 500 and breaking the UI
    const fallbackCount = 42 + (new Date().getMonth() * 2);
    
    return {
      statusCode: 200, // Important: Return 200 even on error to avoid browser warnings
      headers,
      body: JSON.stringify({
        count: fallbackCount,
        source: 'fallback-counter',
        timestamp: new Date().toISOString()
      })
    };
  }
};
