/**
 * API Route: Create Short Link
 * POST /api/links/create
 * 
 * Creates a new shortened link (anonymous or authenticated)
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

// Validate URL
function isValidURL(url) {
  try {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  } catch (e) {
    return false;
  }
}

// Check for malicious URLs
function isMaliciousURL(url) {
  const maliciousPatterns = ['malware', 'phishing', 'spam', 'scam', 'hack'];
  const lowerUrl = url.toLowerCase();
  return maliciousPatterns.some(pattern => lowerUrl.includes(pattern));
}

export default async function handler(req, res) {
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
    const { originalUrl, customAlias, title, password, expiryMinutes, customExpiryDate } = req.body;

    // Validation
    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    if (!isValidURL(originalUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (isMaliciousURL(originalUrl)) {
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

    // Check if short code already exists
    const existingLink = await prisma.link.findUnique({
      where: { shortCode }
    });

    if (existingLink) {
      return res.status(400).json({ error: 'Custom alias already taken' });
    }

    // Calculate expiry time
    let expiryTime = null;
    if (customExpiryDate) {
      expiryTime = new Date(customExpiryDate);
    } else if (expiryMinutes) {
      expiryTime = new Date(Date.now() + parseInt(expiryMinutes) * 60000);
    }

    // Create link
    const link = await prisma.link.create({
      data: {
        userId,
        originalUrl,
        shortCode,
        title: title || null,
        password: password || null,
        expiryTime
      }
    });

    res.status(201).json({
      success: true,
      link,
      shortUrl: `${req.headers.host}/${shortCode}`,
      message: 'Link created successfully'
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
