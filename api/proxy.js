// Serverless proxy function for Vercel
// This handles CORS issues with HLS video streams

export default async function handler(req, res) {
  // Set CORS headers to allow all origins
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
  
  try {
    // Get query parameters
    const { url, referer } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Decode the URL
    const decodedUrl = decodeURIComponent(url);
    
    // Prepare headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };
    
    // Add referer if provided
    if (referer) {
      headers['Referer'] = decodeURIComponent(referer);
    }
    
    // Fetch the content
    const response = await fetch(decodedUrl, { headers });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Proxy target returned ${response.status}: ${response.statusText}` 
      });
    }
    
    // Get content type from original response
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Handle HLS manifest files (m3u8)
    if (contentType?.includes('application/vnd.apple.mpegurl') || 
        contentType?.includes('application/x-mpegurl') ||
        decodedUrl.endsWith('.m3u8')) {
      // Read text content
      const text = await response.text();
      
      // For absolute URLs in the manifest, we don't need to modify anything
      // For relative URLs, we need to handle them differently
      
      // Get base URL for handling relative paths in m3u8 files
      const baseUrl = (() => {
        try {
          const parsedUrl = new URL(decodedUrl);
          const pathParts = parsedUrl.pathname.split('/');
          pathParts.pop(); // Remove filename
          return `${parsedUrl.protocol}//${parsedUrl.host}${pathParts.join('/')}/`;
        } catch (e) {
          return '';
        }
      })();
      
      // Process the m3u8 file to proxy any relative URLs
      const processedContent = text.replace(
        /^(?!#)(?!https?:\/\/)([^#][^\r\n]+)/gm,
        (match) => {
          // If it's already an absolute URL, leave it alone
          if (match.startsWith('http://') || match.startsWith('https://')) {
            return match;
          }
          
          // If it starts with a slash, it's relative to the domain root
          const absoluteUrl = match.startsWith('/')
            ? new URL(match, baseUrl).origin + match
            : baseUrl + match;
            
          // Re-encode the new URL to be passed through our proxy
          return `${req.headers.host.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/proxy?url=${encodeURIComponent(absoluteUrl)}${referer ? `&referer=${encodeURIComponent(referer)}` : ''}`;
        }
      );
      
      return res.send(processedContent);
    }
    
    // For non-text content, just pipe through the response
    const data = await response.arrayBuffer();
    return res.send(Buffer.from(data));
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
} 