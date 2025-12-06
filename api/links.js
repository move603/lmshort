/**
 * Consolidated Links API Route
 * Handles CRUD for Links, Sync, Bulk Delete, and QR Code
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        // --- PUBLIC ROUTES ---
        if (req.method === 'GET' && action === 'qrcode') {
            return await handleQRCode(req, res);
        }

        if (req.method === 'POST' && !action) {
            // Creation can be public (guest) or protected (user)
            return await handleCreate(req, res);
        }

        // --- PROTECTED ROUTES ---
        // Verify Auth for all other routes
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Special case: Create link (handled above) doesn't strictly need auth, but if provided it uses it.
            // But for LIST, DELETE, SYNC we need auth.
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
            return res.status(401).json({ error: 'User not found' });
        }

        if (req.method === 'GET') {
            // Default GET is list links
            return await handleList(req, res, user);
        }

        if (req.method === 'POST') {
            if (action === 'sync') {
                return await handleSync(req, res, user);
            }
        }

        if (req.method === 'DELETE') {
            if (action === 'bulk-delete') {
                return await handleBulkDelete(req, res, user);
            }
            // Default DELETE is single link by ID (using query)
            const { id } = req.query;
            if (id) {
                return await handleDelete(req, res, user, id);
            }
        }

        if (req.method === 'PUT') {
            const { id } = req.query;
            if (id) {
                return await handleEdit(req, res, user, id);
            }
        }

        return res.status(400).json({ error: 'Invalid action or method' });

    } catch (error) {
        console.error('Links API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        await prisma.$disconnect();
    }
};

// --- Handlers ---

async function handleEdit(req, res, user, id) {
    const { title, password, expiryTime } = req.body;

    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.userId !== user.id) return res.status(403).json({ error: 'Not authorized' });

    const updatedLink = await prisma.link.update({
        where: { id },
        data: {
            title: title !== undefined ? title : link.title,
            password: password !== undefined ? password : link.password,
            expiryTime: expiryTime !== undefined ? expiryTime : link.expiryTime
        }
    });

    return res.status(200).json({
        success: true,
        link: {
            ...updatedLink,
            password: updatedLink.password ? 'protected' : null
        },
        message: 'Link updated successfully'
    });
}

async function handleQRCode(req, res) {
    const { shortCode, format = 'dataUrl', size = 300 } = req.query;

    if (!shortCode) {
        return res.status(400).json({ error: 'shortCode parameter is required' });
    }

    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const fullUrl = `${protocol}://${host}/${shortCode}`;

    const qrOptions = {
        width: parseInt(size) || 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
    };

    if (format === 'png') {
        const buffer = await QRCode.toBuffer(fullUrl, qrOptions);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="qr-${shortCode}.png"`);
        return res.status(200).send(buffer);
    } else {
        const dataUrl = await QRCode.toDataURL(fullUrl, qrOptions);
        return res.status(200).json({
            success: true,
            qrCode: dataUrl,
            url: fullUrl,
            shortCode
        });
    }
}

async function handleCreate(req, res) {
    const { originalUrl, customAlias, title, password, expiryMinutes, customExpiryDate, domainId } = req.body;

    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let finalUrl = originalUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
    }

    try {
        new URL(finalUrl);
    } catch (e) {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(originalUrl)}`;
    }

    const maliciousPatterns = ['malware', 'phishing', 'spam', 'scam', 'hack'];
    if (maliciousPatterns.some(p => originalUrl.toLowerCase().includes(p))) {
        return res.status(400).json({ error: 'URL flagged as potentially malicious' });
    }

    // Optional User Auth
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = await prisma.user.findUnique({ where: { email: decoded.email } });
            if (user) userId = user.id;
        } catch (error) {
            // Ignore invalid token for Guest Mode
        }
    }

    let shortCode = customAlias || generateShortCode();
    if (!/^[a-zA-Z0-9]+$/.test(shortCode)) {
        return res.status(400).json({ error: 'Custom alias must be alphanumeric' });
    }

    const existingLink = await prisma.link.findUnique({ where: { shortCode } });
    if (existingLink) {
        return res.status(400).json({ error: 'This alias is already taken. Try another one.' });
    }

    let expiryTime = null;
    if (typeof expiryMinutes === 'number' && expiryMinutes > 0) {
        expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);
    } else if (customExpiryDate) {
        const dt = new Date(customExpiryDate);
        if (!isNaN(dt.getTime())) expiryTime = dt;
    }

    let checkedDomainId = null;
    if (domainId && userId) {
        const domain = await prisma.domain.findFirst({
            where: { id: domainId, userId: userId, verified: true }
        });
        if (domain) checkedDomainId = domain.id;
    }

    const link = await prisma.link.create({
        data: {
            originalUrl: finalUrl,
            shortCode,
            userId,
            title: title || null,
            password: password || null,
            expiryTime,
            domainId: checkedDomainId
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
}

async function handleList(req, res, user) {
    const links = await prisma.link.findMany({
        where: { userId: user.id },
        include: { analytics: true },
        orderBy: { createdAt: 'desc' }
    });

    const enrichedLinks = links.map(link => ({
        ...link,
        isExpired: link.expiryTime ? new Date() > new Date(link.expiryTime) : false,
        isActive: link.expiryTime ? new Date() <= new Date(link.expiryTime) : true
    }));

    return res.status(200).json({ success: true, links: enrichedLinks });
}

async function handleSync(req, res, user) {
    const { shortCodes } = req.body;

    if (!shortCodes || !Array.isArray(shortCodes) || shortCodes.length === 0) {
        return res.status(200).json({ success: true, count: 0 });
    }

    const result = await prisma.link.updateMany({
        where: {
            shortCode: { in: shortCodes },
            userId: null
        },
        data: { userId: user.id }
    });

    return res.status(200).json({ success: true, syncedCount: result.count });
}

async function handleDelete(req, res, user, id) {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.userId !== user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.link.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Link deleted' });
}

async function handleBulkDelete(req, res, user) {
    const { linkIds } = req.body;

    if (!Array.isArray(linkIds) || linkIds.length === 0) {
        return res.status(400).json({ error: 'Link IDs array is required' });
    }
    if (linkIds.length > 100) return res.status(400).json({ error: 'Max 100 links' });

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
}
