// Serverless proxy function for Vercel
// This handles CORS issues with HLS video streams

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get query parameters
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL parameter is required'
      });
    }
    
    // Basic request to test functionality
    try {
      // Decode the URL
      const decodedUrl = decodeURIComponent(url);
      
      // Basic fetch with minimal options
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Proxy target returned ${response.status}`
        });
      }
      
      // Get content type from original response
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      // For simple content, just return it
      const data = await response.arrayBuffer();
      return res.status(200).send(Buffer.from(data));
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ 
        error: 'Proxy fetch failed',
        message: fetchError.message
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message
    });
  }
} 