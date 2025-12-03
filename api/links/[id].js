import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    // Update link
    const { id } = req.query;
    const { title, password, expiryTime } = req.body;

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
      // Check if link exists and belongs to user
      const existingLink = await prisma.link.findUnique({
        where: { id },
      });

      if (!existingLink || existingLink.userId !== userId) {
        return res.status(404).json({ error: 'Link not found' });
      }

      // Update link
      const updatedLink = await prisma.link.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existingLink.title,
          password: password !== undefined ? password : existingLink.password,
          expiryTime: expiryTime !== undefined ? (expiryTime ? new Date(expiryTime) : null) : existingLink.expiryTime,
        },
      });

      res.status(200).json({ success: true, link: updatedLink });
    } catch (error) {
      console.error('Update link error:', error);
      res.status(500).json({ error: 'Failed to update link' });
    }
  } else if (req.method === 'DELETE') {
    // Delete link
    const { id } = req.query;

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
      // Check if link exists and belongs to user
      const existingLink = await prisma.link.findUnique({
        where: { id },
      });

      if (!existingLink || existingLink.userId !== userId) {
        return res.status(404).json({ error: 'Link not found' });
      }

      // Delete link
      await prisma.link.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Link deleted successfully' });
    } catch (error) {
      console.error('Delete link error:', error);
      res.status(500).json({ error: 'Failed to delete link' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
