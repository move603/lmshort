/**
 * API Route: Add Custom Domain
 * POST /api/domains/add
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        // Basic domain validation
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
        if (!domainRegex.test(domain)) {
            return res.status(400).json({ error: 'Invalid domain format' });
        }

        // Check if domain exists
        const existingDomain = await prisma.domain.findUnique({
            where: { domain }
        });

        if (existingDomain) {
            return res.status(400).json({ error: 'Domain already registered' });
        }

        // Generate TXT record for verification
        const txtRecord = `securelink-verification=${crypto.randomBytes(16).toString('hex')}`;

        const newDomain = await prisma.domain.create({
            data: {
                domain,
                userId: user.id,
                txtRecord,
                verified: false
            }
        });

        return res.status(201).json({
            success: true,
            domain: newDomain
        });

    } catch (error) {
        console.error('Add domain error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
}
