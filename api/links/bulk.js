/**
 * API Route: Bulk Create Links
 * POST /api/links/bulk
 * 
 * Creates multiple shortened links at once (anonymous or authenticated)
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Generate random short code
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    if (urls.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 URLs allowed per request' });
    }

    // Get user ID if authenticated (optional)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (user) userId = user.id;
      } catch (error) {
        // Continue as anonymous if token is invalid
      }
    }

    const createdLinks = [];
    const errors = [];

    for (const url of urls) {
      try {
        const shortCode = generateShortCode();
        
        const link = await prisma.link.create({
          data: {
            userId,
            originalUrl: url,
            shortCode
          }
        });

        createdLinks.push({
          originalUrl: url,
          shortUrl: `${req.headers.host}/${shortCode}`,
          shortCode
        });
      } catch (error) {
        errors.push({ url, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      created: createdLinks.length,
      failed: errors.length,
      links: createdLinks,
      errors
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
