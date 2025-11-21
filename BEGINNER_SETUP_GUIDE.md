# 🚀 Complete Beginner's Guide to SecureLink Setup

This guide will walk you through **everything** step-by-step. No prior knowledge needed!

---

## 📋 Table of Contents

1. [What You Need Before Starting](#1-what-you-need-before-starting)
2. [Understanding Your Project Files](#2-understanding-your-project-files)
3. [Setting Up the .env File](#3-setting-up-the-env-file)
4. [Installing Everything on Your Computer](#4-installing-everything-on-your-computer)
5. [Running the Project Locally](#5-running-the-project-locally)
6. [Deploying to Vercel (Making it Live)](#6-deploying-to-vercel-making-it-live)
7. [Troubleshooting Common Issues](#7-troubleshooting-common-issues)

---

## 1. What You Need Before Starting

### Required Software (All Free):

1. **Node.js** - Download from: https://nodejs.org/
   - Click the big green "LTS" button (Long Term Support)
   - Install it like any other program
   - To check if installed: Open terminal/command prompt and type: `node --version`

2. **Git** - Download from: https://git-scm.com/
   - Install with default settings
   - To check if installed: Type in terminal: `git --version`

3. **VS Code** (Text Editor) - Download from: https://code.visualstudio.com/
   - This is where you'll edit your code
   - Install with default settings

4. **GitHub Account** - Sign up at: https://github.com/
   - Free account is perfect
   - Remember your username and password

5. **Vercel Account** - Sign up at: https://vercel.com/
   - Click "Sign up with GitHub" (easiest way)
   - This is where your website will live for free

---

## 2. Understanding Your Project Files

### Your Project Folder Structure:

```
shortlinker/                    ← Your main project folder
├── api/                        ← Backend code (serverless functions)
│   ├── auth/                   ← Login/signup code
│   │   ├── register.js
│   │   ├── login.js
│   │   └── me.js
│   ├── links/                  ← Link creation/management
│   │   ├── create.js
│   │   ├── index.js
│   │   └── bulk.js
│   ├── health.js               ← Health check
│   └── [code].js               ← Redirect handler
├── public/                     ← Frontend (what users see)
│   ├── index.html              ← Homepage
│   └── dashboard.html          ← User dashboard
├── prisma/                     ← Database setup
│   └── schema.prisma           ← Database structure
├── .env                        ← SECRET settings (YOU NEED TO CREATE THIS!)
├── .env.example                ← Example of .env (template)
├── vercel.json                 ← Vercel configuration
├── package.json                ← List of dependencies
├── prisma-migrate.js           ← Database migration script
└── README.md                   ← Documentation
```

### What Each Folder Does:

- **api/** = Backend logic (authentication, database operations)
- **public/** = Frontend (HTML pages users see)
- **prisma/** = Database configuration
- **.env** = Secret keys (YOU NEED TO CREATE THIS!)

---

## 3. Setting Up the .env File

### Step-by-Step Instructions:

#### **STEP 1: Create the .env file**

1. Open your project folder in VS Code
2. Look at the left sidebar (file list)
3. You'll see `.env.example` file
4. **Right-click** on empty space in the file list
5. Click **"New File"**
6. Name it exactly: `.env` (with the dot at the start!)

#### **STEP 2: Copy the content**

1. Open the `.env` file I created above
2. Copy **everything** from it
3. Paste it into your new `.env` file
4. Save the file (Ctrl+S or Cmd+S)

#### **STEP 3: Change the JWT_SECRET**

⚠️ **IMPORTANT:** You MUST change this for security!

**Option A - Easy Way (Random.org):**
1. Go to: https://www.random.org/strings/
2. Settings:
   - Generate: **1** string
   - Length: **32** characters
   - Characters: Use **Alphanumeric**
3. Click **"Get Strings"**
4. Copy the random string
5. In your `.env` file, replace this part:
   ```
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
   ```
   With:
   ```
   JWT_SECRET="YOUR_RANDOM_STRING_HERE"
   ```

**Option B - Terminal Way (More Secure):**
1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Type: `openssl rand -base64 32`
3. Press Enter
4. Copy the output
5. Replace the JWT_SECRET value in `.env` with it

#### **STEP 4: Verify Your .env File**

Your `.env` file should now look like this:

```env
DATABASE_URL="postgresql://neondb_owner:npg_U4x5fneDmMlg@ep-odd-bread-aee1a54j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

JWT_SECRET="abc123xyz789randomstring456def"

BASE_URL="http://localhost:3000"
```

✅ **DATABASE_URL** = Already configured (don't change!)
✅ **JWT_SECRET** = Your unique random string
✅ **BASE_URL** = Leave as-is for now

---

## 4. Installing Everything on Your Computer

### Step-by-Step Installation:

#### **STEP 1: Open Terminal in Your Project Folder**

**VS Code Way (Easiest):**
1. Open your project folder in VS Code
2. Go to: **Terminal** → **New Terminal** (top menu)
3. A terminal window opens at the bottom

**Manual Way:**
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Type: `cd path/to/your/shortlinker/folder`
3. Press Enter

#### **STEP 2: Install Dependencies**

In the terminal, type these commands one by one:

```bash
# Install all required packages
npm install

# This will install:
# - Prisma (database tool)
# - @prisma/client (database connector)
# - bcryptjs (password encryption)
# - jsonwebtoken (user authentication)
# - qrcode (QR code generator)
# - cors (API security)
```

⏳ **Wait 1-3 minutes** while it downloads everything.

You'll see lots of text scrolling - that's normal!

#### **STEP 3: Generate Prisma Client**

This creates the code to talk to your database:

```bash
npx prisma generate
```

You should see: ✅ "Generated Prisma Client"

#### **STEP 4: Run Database Migrations**

This creates the tables in your database:

```bash
npx prisma migrate deploy
```

You should see: ✅ "All migrations have been successfully applied"

---

## 5. Running the Project Locally

### Test Your Website on Your Computer:

#### **STEP 1: Start the Development Server**

In terminal, type:

```bash
npm run dev
```

OR

```bash
vercel dev
```

You should see:
```
> Ready! Available at http://localhost:3000
```

#### **STEP 2: Open in Browser**

1. Open your web browser (Chrome, Firefox, etc.)
2. Go to: `http://localhost:3000`
3. You should see your SecureLink homepage! 🎉

#### **STEP 3: Test the Features**

**Test Anonymous Link Creation:**
1. Enter a URL: `https://google.com`
2. Click "Generate Short Link"
3. You should see a success message!

**Test User Registration:**
1. Go to: `http://localhost:3000/dashboard`
2. Click "Sign up"
3. Fill in name, email, password
4. Solve the CAPTCHA (simple math)
5. Click "Create Account"
6. You should be logged in! 🎉

**Test Link Management:**
1. In dashboard, click "Create New Link"
2. Create a link
3. Return to dashboard - you should see it in your list!

#### **STEP 4: Stop the Server**

When you're done testing:
- Press **Ctrl+C** in the terminal
- This stops the server

---

## 6. Deploying to Vercel (Making it Live)

### Step-by-Step Vercel Deployment:

#### **STEP 1: Push Code to GitHub**

**First Time Setup:**

1. Open terminal in your project folder
2. Type these commands one by one:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: SecureLink app"

# Create a repository on GitHub:
# - Go to https://github.com/
# - Click the "+" icon (top right)
# - Click "New repository"
# - Name it: "securelink" (or any name you want)
# - Keep it PUBLIC
# - DO NOT add README, .gitignore, or license
# - Click "Create repository"

# Connect to GitHub (replace YOUR-USERNAME and YOUR-REPO):
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Push your code
git branch -M main
git push -u origin main
```

**Future Updates:**

```bash
git add .
git commit -m "Updated features"
git push
```

#### **STEP 2: Deploy on Vercel**

1. Go to: https://vercel.com/
2. Click **"Sign in with GitHub"**
3. Click **"Import Project"** or **"Add New"** → **"Project"**
4. Find your GitHub repository (securelink)
5. Click **"Import"**

#### **STEP 3: Configure Environment Variables**

⚠️ **SUPER IMPORTANT!** Before clicking "Deploy", you need to add your secrets:

1. Scroll down to **"Environment Variables"**
2. Add these TWO variables:

**Variable 1:**
- **Name:** `DATABASE_URL`
- **Value:** 
  ```
  postgresql://neondb_owner:npg_U4x5fneDmMlg@ep-odd-bread-aee1a54j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- Click **"Add"**

**Variable 2:**
- **Name:** `JWT_SECRET`
- **Value:** (Copy from your `.env` file - your random string)
- Click **"Add"**

#### **STEP 4: Deploy!**

1. Click **"Deploy"**
2. Wait 2-5 minutes (grab a coffee ☕)
3. You'll see: ✅ "Deployment Ready"
4. Click **"Visit"** to see your live website!

#### **STEP 5: Get Your Live URL**

Your website is now live at:
```
https://your-project-name.vercel.app
```

Example: `https://securelink-abc123.vercel.app`

---

## 7. Troubleshooting Common Issues

### Issue 1: "npm: command not found"

**Problem:** Node.js is not installed.

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install it
3. Restart your terminal
4. Try again

---

### Issue 2: ".env file not found"

**Problem:** The `.env` file is not in the right place.

**Solution:**
1. Make sure `.env` is in your project root folder
2. Same level as `package.json`
3. Make sure it's named exactly `.env` (not `.env.txt`)

---

### Issue 3: "Prisma Client did not initialize yet"

**Problem:** Prisma client wasn't generated.

**Solution:**
```bash
npx prisma generate
```

---

### Issue 4: "Database connection failed"

**Problem:** DATABASE_URL is incorrect.

**Solution:**
1. Check your `.env` file
2. Make sure DATABASE_URL is on ONE line (no line breaks)
3. Copy the exact string from this guide

---

### Issue 5: "Port 3000 is already in use"

**Problem:** Another app is using port 3000.

**Solution:**
```bash
# Kill the process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
vercel dev --listen 3001
```

---

### Issue 6: Input text is not visible (white on white)

**Problem:** CSS visibility issue.

**Solution:**
This is already fixed in the latest code! Make sure you're using the updated `public/index.html` and `public/dashboard.html` files.

---

## 📚 Quick Reference Commands

### Development Commands:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start local server
npm run dev
# OR
vercel dev

# View database (opens in browser)
npx prisma studio
```

### Git Commands:

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes
git pull
```

### Vercel Commands:

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy manually
vercel --prod
```

---

## 🎯 Where to Find Everything:

| What | Where | Description |
|------|-------|-------------|
| **Homepage** | `/public/index.html` | Anonymous link creation page |
| **Dashboard** | `/public/dashboard.html` | User login and link management |
| **API Routes** | `/api/` folder | All backend logic |
| **Database Config** | `/prisma/schema.prisma` | Database structure |
| **Environment Variables** | `/.env` | Secret keys (local) |
| **Vercel Settings** | Vercel dashboard | Secret keys (production) |
| **Dependencies** | `/package.json` | List of installed packages |

---

## ✅ Checklist for Deployment:

- [ ] Node.js installed
- [ ] Git installed
- [ ] VS Code installed
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] `.env` file created and configured
- [ ] JWT_SECRET changed to random string
- [ ] `npm install` completed
- [ ] `npx prisma generate` completed
- [ ] `npx prisma migrate deploy` completed
- [ ] Tested locally with `npm run dev`
- [ ] Code pushed to GitHub
- [ ] Environment variables added in Vercel
- [ ] Deployed on Vercel
- [ ] Tested live website

---

## 🎉 You're Done!

If you followed all steps, you now have:

✅ A fully functional link shortener  
✅ Running locally on your computer  
✅ Deployed live on Vercel  
✅ Connected to a PostgreSQL database  
✅ Secure authentication system  
✅ Beautiful modern UI  

### What to Do Next:

1. **Share your link:** `https://your-project.vercel.app`
2. **Create an account** on your live site
3. **Start shortening links!**
4. **Customize** the branding in settings
5. **Share with friends!**

---

## 🆘 Need More Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Node.js Documentation:** https://nodejs.org/docs

---

## 🎊 Congratulations!

You've successfully set up and deployed a production-ready link shortener!

You're no longer a beginner - you're a developer! 🚀
