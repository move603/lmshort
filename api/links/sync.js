/**
 * API Route: Sync Guest Links
 * POST /api/links/sync
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
    // CORS Headers
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
        // Authenticate user
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await prisma.user.findUnique({ where: { email: decoded.email } });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const { shortCodes } = req.body;

        if (!shortCodes || !Array.isArray(shortCodes) || shortCodes.length === 0) {
            return res.status(200).json({ success: true, count: 0 }); // Nothing to sync
        }

        // Update links that match the shortCodes AND have no owner (guest links)
        const result = await prisma.link.updateMany({
            where: {
                shortCode: { in: shortCodes },
                userId: null // Only claim unowned links
            },
            data: {
                userId: user.id
            }
        });

        return res.status(200).json({
            success: true,
            syncedCount: result.count
        });

    } catch (error) {
        console.error('Sync links error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
}
