/**
 * API Route: Create Short Link
 * POST /api/links/create
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = async function handler(req, res) {
  // CORS headers
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
    const { originalUrl, customAlias, title, password, expiryMinutes, customExpiryDate } = req.body;

    // Validation
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic URL validation - allow URLs with or without protocol, and random text
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    const hasProtocol = originalUrl.startsWith('http://') || originalUrl.startsWith('https://');

    let finalUrl = originalUrl;

    // If it looks like a URL (has domain-like structure), validate and normalize it
    if (urlPattern.test(originalUrl) || hasProtocol) {
      try {
        // Add protocol if missing for URL constructor
        finalUrl = hasProtocol ? originalUrl : `https://${originalUrl}`;
        new URL(finalUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    } else {
      // If it's not a URL-like string, treat it as a search query
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(originalUrl)}`;
    }

    // Spam/malicious filter (basic)
    const maliciousPatterns = ['malware', 'phishing', 'spam', 'scam', 'hack'];
    if (maliciousPatterns.some(p => originalUrl.toLowerCase().includes(p))) {
      return res.status(400).json({ error: 'URL flagged as potentially malicious' });
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

    // Generate or use custom short code
    let shortCode = customAlias || generateShortCode();
    
    // Ensure short code is alphanumeric
    if (!/^[a-zA-Z0-9]+$/.test(shortCode)) {
      return res.status(400).json({ error: 'Custom alias must be alphanumeric' });
    }

    // Check if short code already exists
    const existingLink = await prisma.link.findUnique({
      where: { shortCode }
    });

    if (existingLink) {
      return res.status(400).json({ error: 'This alias is already taken. Try another one.' });
    }

    // Compute expiry time if provided
    let expiryTime = null;
    if (typeof expiryMinutes === 'number' && expiryMinutes > 0) {
      expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);
    } else if (customExpiryDate) {
      const dt = new Date(customExpiryDate);
      if (!isNaN(dt.getTime())) {
        expiryTime = dt;
      }
    }

    // Create link
    const link = await prisma.link.create({
      data: {
        originalUrl: finalUrl,
        shortCode,
        userId,
        title: title || null,
        password: password || null,
        expiryTime
      }
    });

    return res.status(201).json({
      success: true,
      link: {
        id: link.id,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        title: link.title,
        password: link.password ? 'protected' : null,
        expiryTime: link.expiryTime,
        clicks: link.clicks,
        createdAt: link.createdAt
      }
    });
  } catch (error) {
    console.error('Create link error:', error);
    return res.status(500).json({ 
      error: 'Failed to create link. Please try again.',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
