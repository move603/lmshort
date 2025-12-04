/**
 * API Route: Generate QR Code
 * GET /api/links/qrcode?shortCode=abc123
 * 
 * Generates a QR code for a shortened link
 */

const QRCode = require('qrcode');

module.exports = async function handler(req, res) {
    // Enable CORS
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
        const { shortCode, format = 'dataUrl', size = 300 } = req.query;

        if (!shortCode) {
            return res.status(400).json({ error: 'shortCode parameter is required' });
        }

        // Build the full URL
        const host = req.headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const fullUrl = `${protocol}://${host}/${shortCode}`;

        // QR Code options
        const qrOptions = {
            width: parseInt(size) || 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        };

        if (format === 'png') {
            // Return as PNG buffer
            const buffer = await QRCode.toBuffer(fullUrl, qrOptions);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="qr-${shortCode}.png"`);
            return res.status(200).send(buffer);
        } else {
            // Return as data URL (default)
            const dataUrl = await QRCode.toDataURL(fullUrl, qrOptions);
            return res.status(200).json({
                success: true,
                qrCode: dataUrl,
                url: fullUrl,
                shortCode
            });
        }
    } catch (error) {
        console.error('QR Code generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate QR code',
            details: error.message
        });
    }
}
