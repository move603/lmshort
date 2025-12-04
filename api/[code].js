/**
 * API Route: Redirect Handler
 * GET /api/[code]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    // Find link
    const link = await prisma.link.findUnique({
      where: { shortCode: code }
    });

    if (!link) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>404 - Link Not Found</h1>
            <p>This short link doesn't exist.</p>
            <a href="/">Go Home</a>
          </body>
        </html>
      `);
    }

    // Handle expiry
    if (link.expiryTime && new Date() > new Date(link.expiryTime)) {
      return res.status(410).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>410 - Link Expired</h1>
            <p>This short link has expired.</p>
            <a href="/">Create a new link</a>
          </body>
        </html>
      `);
    }

    // If link requires password
    if (link.password) {
      if (req.method === 'POST') {
        const { password } = req.body || {};
        if (!password || password !== link.password) {
          return res.status(401).json({ error: 'Incorrect password' });
        }
        // correct password: proceed to redirect
      } else {
        // Show simple password prompt page
        return res.status(200).send(`
          <html>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>Protected Link</h1>
              <p>This link is password protected. Enter the password to continue.</p>
              <form method="POST" action="/${code}">
                <input type="password" name="password" placeholder="Password" style="padding:10px;" />
                <button type="submit" style="padding:10px 20px;">Unlock</button>
              </form>
            </body>
          </html>
        `);
      }
    }

    // Update click count
    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    });

    // Create analytics record
    try {
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || req.headers['referrer'] || '';

      // Determine device type
      let device = 'Desktop';
      if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
        device = /tablet|ipad/i.test(userAgent) ? 'Tablet' : 'Mobile';
      }

      await prisma.analytics.create({
        data: {
          linkId: link.id,
          device,
          referrer,
          userAgent
        }
      });
    } catch (analyticsError) {
      // Don't fail the redirect if analytics fails
      console.error('Analytics error:', analyticsError);
    }

    // Redirect to original URL
    return res.redirect(302, link.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>500 - Server Error</h1>
          <p>Sorry, something went wrong.</p>
          <a href="/">Go Home</a>
        </body>
      </html>
    `);
  } finally {
    await prisma.$disconnect();
  }
}
