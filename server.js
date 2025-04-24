import express from 'express';
import cors from 'cors';
import axios from 'axios';
import url from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Proxy endpoint for video streams
app.get('/proxy', async (req, res) => {
  const requestUrl = req.query.url;
  const referer = req.query.referer || '';
  
  if (!requestUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Forward the request to the target URL
    const response = await axios({
      method: 'get',
      url: requestUrl,
      responseType: 'stream',
      headers: {
        // Forward necessary headers including referer if needed
        'Referer': referer,
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Origin': req.headers['origin'] || 'http://localhost:5173',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Accept-Encoding': req.headers['accept-encoding'] || 'gzip, deflate, br'
      },
      maxRedirects: 5, // Allow redirects
      timeout: 30000, // 30 second timeout
    });
    
    // Forward all response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      // Don't forward content-length as it may be incorrect after our modifications
      if (key.toLowerCase() !== 'content-length') {
        res.set(key, value);
      }
    });
    
    // Ensure CORS headers are set
    res.set('Access-Control-Allow-Origin', '*');
    
    // If the response is an m3u8 file, we might need to modify it to proxy all segment URLs
    const contentType = response.headers['content-type'];
    if (contentType && (contentType.includes('application/vnd.apple.mpegurl') || 
        contentType.includes('application/x-mpegurl') || 
        requestUrl.endsWith('.m3u8'))) {
      
      // Extract the base URL from the requested URL
      const parsedUrl = new URL(requestUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)}`;
      
      // Don't pipe directly, instead collect the data, modify it, and send
      let body = '';
      response.data.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      response.data.on('end', () => {
        // Replace relative URLs with absolute URLs in the m3u8 file
        const modifiedBody = body.replace(/(^|\n)((?!#)(?!https?:\/\/)[^#\n][^\n]*)(\n|$)/g, (match, start, relativePath, end) => {
          // If this is a relative path, prefix it with the base URL and proxy it
          const trimmedPath = relativePath.trim();
          
          if (trimmedPath) {
            const absoluteUrl = trimmedPath.startsWith('/') 
              ? `${parsedUrl.protocol}//${parsedUrl.host}${trimmedPath}`
              : `${baseUrl}${trimmedPath}`;
              
            // Replace with the proxied URL
            const proxyUrl = `/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            
            return `${start}${proxyUrl}${end}`;
          }
          
          return match;
        });
        
        res.send(modifiedBody);
      });
    } else {
      // For non-m3u8 files, pipe the response directly
      response.data.pipe(res);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      console.error(`Server responded with status: ${error.response.status}`);
    }
    res.status(500).json({ 
      error: 'Failed to proxy request',
      details: error.message,
      url: requestUrl
    });
  }
});

// Simple status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Access http://localhost:${PORT}/status to check server status`);
}); 