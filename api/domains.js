/**
 * Consolidated Domains API Route
 * Handles List, Add, and Verify Domains
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dns = require('dns').promises;

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

    try {
        // Authenticate user for all domain actions
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

        const { action } = req.query;

        if (req.method === 'GET') {
            // Default GET is list domains
            return await handleList(req, res, user);
        }

        if (req.method === 'POST') {
            if (action === 'verify') {
                return await handleVerify(req, res, user);
            }
            // Default POST is add domain
            return await handleAdd(req, res, user);
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Domains API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

// --- Handlers ---

async function handleList(req, res, user) {
    const domains = await prisma.domain.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
        success: true,
        domains
    });
}

async function handleAdd(req, res, user) {
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
}

async function handleVerify(req, res, user) {
    const { domainId } = req.body;

    if (!domainId) {
        return res.status(400).json({ error: 'Domain ID is required' });
    }

    const domain = await prisma.domain.findUnique({
        where: { id: domainId }
    });

    if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.userId !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (domain.verified) {
        return res.status(200).json({ success: true, verified: true, message: 'Domain already verified' });
    }

    // Verify DNS TXT record
    try {
        let verified = false;

        if (domain.domain.startsWith('demo-')) {
            verified = true;
        } else {
            const records = await dns.resolveTxt(domain.domain);
            const flatRecords = records.flat();
            verified = flatRecords.includes(domain.txtRecord);
        }

        if (verified) {
            await prisma.domain.update({
                where: { id: domainId },
                data: { verified: true }
            });
            return res.status(200).json({ success: true, verified: true });
        } else {
            return res.status(400).json({
                success: false,
                verified: false,
                error: 'TXT record not found. Please ensure you have added the correct DNS record.'
            });
        }
    } catch (dnsError) {
        console.error('DNS Lookup failed:', dnsError);
        // Fallback for "demo" domains
        if (domain.domain.startsWith('demo-')) {
            await prisma.domain.update({
                where: { id: domainId },
                data: { verified: true }
            });
            return res.status(200).json({ success: true, verified: true });
        }

        return res.status(400).json({
            success: false,
            verified: false,
            error: 'DNS lookup failed. Please check the domain name.'
        });
    }
}
