// Netlify function to handle visitor counting
// This avoids CORS issues by proxying requests to CountAPI

const fetch = require('node-fetch');

// The namespace and key for our counter
const NAMESPACE = 'circuitsanctum';
const KEY = 'visits';

exports.handler = async function(event, context) {
  try {
    // Set CORS headers to allow requests from our site
    const headers = {
      'Access-Control-Allow-Origin': '*', // Or restrict to your domain
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    // Call CountAPI to increment and get visitor count
    const response = await fetch(`https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`CountAPI returned status: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Return the visitor count to the client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        count: data.value,
        source: 'CountAPI',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    // Log error and return fallback response
    console.error('Error fetching visitor count:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch visitor count',
        message: error.message
      })
    };
  }
};
