import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { linkIds } = req.body;

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      return res.status(400).json({ error: 'linkIds array is required' });
    }

    // Verify all links belong to the user
    const links = await prisma.link.findMany({
      where: {
        id: { in: linkIds },
        userId: userId
      }
    });

    if (links.length !== linkIds.length) {
      return res.status(404).json({ error: 'Some links not found or do not belong to user' });
    }

    // Delete the links
    const deleteResult = await prisma.link.deleteMany({
      where: {
        id: { in: linkIds },
        userId: userId
      }
    });

    res.status(200).json({
      success: true,
      deleted: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} link${deleteResult.count > 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete links' });
  }
}
