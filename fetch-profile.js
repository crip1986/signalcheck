// Netlify Function: /.netlify/functions/fetch-profile?handle=naval
// Fetches real public X/Twitter profile data using Twitter API v2

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const handle = event.queryStringParameters?.handle || 'naval';
  const cleanHandle = handle.replace('@', '').trim();

  if (!cleanHandle) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Handle is required' })
    };
  }

  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'X_BEARER_TOKEN not configured in Netlify environment variables' 
      })
    };
  }

  try {
    // Twitter API v2 - Get user by username
    const url = `https://api.twitter.com/2/users/by/username/${cleanHandle}?user.fields=description,profile_image_url,public_metrics,verified,created_at,location`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'User-Agent': 'signalcheck/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fetch profile from X',
          details: response.status === 404 ? 'User not found' : 'API error'
        })
      };
    }

    const data = await response.json();

    // Return clean data to frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data.data || null,
        meta: data.meta || null
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error while fetching profile',
        message: error.message 
      })
    };
  }
};