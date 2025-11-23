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

    // Update click count
    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    });

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
