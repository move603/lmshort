/**
 * API Route: List User Domains
 * GET /api/domains/list
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
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

        const domains = await prisma.domain.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            domains
        });

    } catch (error) {
        console.error('List domains error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
}
