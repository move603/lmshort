/**
 * Consolidated Auth API Route
 * Handles Login, Register, and Get Current User
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type } = req.query;

    try {
        if (req.method === 'GET') {
            if (type === 'me') {
                return await handleMe(req, res);
            }
        }

        if (req.method === 'POST') {
            if (type === 'login') {
                return await handleLogin(req, res);
            }
            if (type === 'register') {
                return await handleRegister(req, res);
            }
        }

        return res.status(400).json({ error: 'Invalid auth type or method' });

    } catch (error) {
        console.error('Auth API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

// --- Handlers ---

async function handleLogin(req, res) {
    const { email, password, captchaAnswer, captchaCorrect } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // CAPTCHA validation
    if (parseInt(captchaAnswer) !== parseInt(captchaCorrect)) {
        return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate new token
    const token = jwt.sign(
        { email: user.email, userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
    );

    // Update user's token and last login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            token,
            lastLogin: new Date()
        }
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
        success: true,
        user: { ...userWithoutPassword, token },
        message: 'Login successful'
    });
}

async function handleRegister(req, res) {
    const { name, email, password, captchaAnswer, captchaCorrect } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // CAPTCHA validation
    if (parseInt(captchaAnswer) !== parseInt(captchaCorrect)) {
        return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate JWT token
    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
    );

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            token,
            lastLogin: new Date()
        }
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
        success: true,
        user: userWithoutPassword,
        message: 'Account created successfully'
    });
}

async function handleMe(req, res) {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: decoded.email }
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
        success: true,
        user: userWithoutPassword
    });
}
