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
    // Generate a very modest count in the 20-35 range as requested
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
    
    // Base count starts at exactly 20
    const baseCount = 20;
    
    // Small variance based on day of week (0-3 visitors)
    // Weekends (Sat-Sun) have slightly higher traffic
    const dayVariance = (dayOfWeek === 0 || dayOfWeek === 6) ? 3 : (dayOfWeek % 3);
    
    // Hour-based variance (0-7 visitors based on time of day)
    // Peak hours are between 5pm-8pm (17-20), lowest in early morning
    let hourlyVariance = 0;
    if (hour >= 17 && hour <= 20) {
      // Peak hours: 5-7 additional visitors
      hourlyVariance = 5 + Math.min(2, hour - 17);
    } else if (hour > 8 && hour < 17) {
      // Working hours: 2-4 additional visitors
      hourlyVariance = 2 + Math.floor((hour - 8) / 3);
    } else if (hour > 20) {
      // Evening hours: 3-1 additional visitors (decreasing)
      hourlyVariance = Math.max(1, 4 - Math.floor((hour - 20) / 2));
    } else {
      // Early morning: 0-1 additional visitors
      hourlyVariance = Math.min(1, hour);
    }
    
    // Calculate the final count - should be in the 20-35 range
    let count = baseCount + dayVariance + hourlyVariance;
    
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
    // Even on error, return a very modest fallback count
    // This prevents the function from returning a 500 and breaking the UI
    const fallbackCount = 20 + (new Date().getHours() % 10);
    
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
