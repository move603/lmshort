/**
 * API Route: Get User Links
 * GET /api/links
 * 
 * Returns all links for authenticated user with analytics
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
      }

      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify link ownership
      const link = await prisma.link.findUnique({ where: { id } });
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      if (link.userId !== user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this link' });
      }

      // Delete link (analytics will cascade delete)
      await prisma.link.delete({ where: { id } });

      return res.status(200).json({ success: true, message: 'Link deleted' });
    } catch (error) {
      console.error('Delete link error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  }

  // Handle GET request
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all user's links with analytics
    const links = await prisma.link.findMany({
      where: { userId: user.id },
      include: {
        analytics: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add computed fields for frontend
    const enrichedLinks = links.map(link => ({
      ...link,
      isExpired: link.expiryTime ? new Date() > new Date(link.expiryTime) : false,
      isActive: link.expiryTime ? new Date() <= new Date(link.expiryTime) : true
    }));

    res.status(200).json({
      success: true,
      links: enrichedLinks
    });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
