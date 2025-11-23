/**
 * API Route: Redirect Handler
 * GET /api/[code] or GET /[code]
 * 
 * Handles short link redirects and analytics tracking
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get device type from user agent
function getDeviceType(userAgent) {
  const ua = userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Short code is required' });
    }

    // Find link
    const link = await prisma.link.findUnique({
      where: { shortCode: code }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check expiry
    if (link.expiryTime && new Date() > new Date(link.expiryTime)) {
      return res.status(410).json({ 
        error: 'This link has expired',
        expiredAt: link.expiryTime
      });
    }

    // Handle POST request (password verification)
    if (req.method === 'POST') {
      const { password } = req.body;

      if (link.password && link.password !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      return res.status(200).json({
        success: true,
        requiresPassword: !!link.password,
        passwordCorrect: true
      });
    }

    // Handle GET request (redirect or JSON response based on Accept header)
    if (req.method === 'GET') {
      // Check if password is required
      if (link.password) {
        return res.status(200).json({
          requiresPassword: true,
          shortCode: code,
          title: link.title
        });
      }

      // Record analytics
      const device = getDeviceType(req.headers['user-agent']);
      const referrer = req.headers.referer || req.headers.referrer || 'Direct';

      await prisma.$transaction([
        // Increment click count
        prisma.link.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } }
        }),
        // Create analytics record
        prisma.analytics.create({
          data: {
            linkId: link.id,
            device,
            referrer,
            userAgent: req.headers['user-agent'] || 'Unknown'
          }
        })
      ]);

      // Check Accept header to decide response type
      const acceptHeader = req.headers.accept || '';
      if (acceptHeader.includes('application/json')) {
        // Respond with JSON containing redirect URL
        return res.status(200).json({
          success: true,
          redirectUrl: link.originalUrl
        });
      } else {
        // Redirect to original URL for browser requests
        return res.redirect(302, link.originalUrl);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
