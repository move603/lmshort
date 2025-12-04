/**
 * API Route: Bulk Delete Links
 * DELETE /api/links/bulk-delete
 * 
 * Deletes multiple links at once for authenticated user
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { linkIds } = req.body;

        // Validation
        if (!Array.isArray(linkIds) || linkIds.length === 0) {
            return res.status(400).json({ error: 'Link IDs array is required' });
        }

        if (linkIds.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 links can be deleted at once' });
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

        const user = await prisma.user.findUnique({
            where: { email: decoded.email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete links that belong to the user
        const deleteResult = await prisma.link.deleteMany({
            where: {
                id: { in: linkIds },
                userId: user.id
            }
        });

        return res.status(200).json({
            success: true,
            deleted: deleteResult.count,
            message: `Successfully deleted ${deleteResult.count} link(s)`
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return res.status(500).json({
            error: 'Failed to delete links',
            details: error.message
        });
    } finally {
        await prisma.$disconnect();
    }
}
