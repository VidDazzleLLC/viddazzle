/**
 * Simple Health Check Endpoint
 * Returns 200 OK to indicate the service is running
 */

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return a simple 200 OK response
  return res.status(200).json({
    status: 'healthy',
    service: 'viddazzle'
  });
}
