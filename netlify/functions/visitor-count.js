// Netlify function to handle visitor counting using CountAPI
// This avoids CORS issues by proxying requests to CountAPI
const fetch = require('node-fetch');

// Configuration for CountAPI
const NAMESPACE = 'vibeversearcade'; // Unique namespace for the site
const KEY = 'visitors';           // Key for the visitor counter

/**
 * Netlify serverless function that acts as a proxy to CountAPI
 * This allows the front-end to track visitors without CORS issues
 */
exports.handler = async function(event) {
  // Define headers for CORS support
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
    // Determine which CountAPI endpoint to use based on query parameters
    // Default to 'hit' which increments and returns the count
    const action = event.queryStringParameters?.action || 'hit';
    
    let url;
    switch(action) {
      case 'get':
        // Just get the current count without incrementing
        url = `https://api.countapi.xyz/get/${NAMESPACE}/${KEY}`;
        break;
      case 'hit':
      default:
        // Increment and get the count (default behavior)
        url = `https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`;
        break;
    }
    
    // Call CountAPI
    console.log(`Calling CountAPI: ${url}`);
    const response = await fetch(url);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`CountAPI returned status: ${response.status}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Return the count to the client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: data.value,
        source: 'CountAPI',
        namespace: NAMESPACE,
        key: KEY,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    // Log the error
    console.error('Error calling CountAPI:', error);
    
    // Return a fallback count and error info
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get visitor count',
        message: error.message,
        // Provide a fallback count so the UI doesn't break
        count: 1000 + Math.floor(Math.random() * 1000),
        source: 'fallback',
        timestamp: new Date().toISOString()
      })
    };
  }
};
