# 🔗 SecureLink - Production-Ready Link Shortener

A modern, secure, and feature-rich URL shortener built with **PostgreSQL (Neon)**, **Prisma ORM**, and deployed on **Vercel** as serverless functions.

## ✨ Features

### 🔒 **High Security**
- CAPTCHA protection on login/signup to prevent bot usage
- Password-protected links for sensitive URLs
- Advanced spam filtering to block malicious URLs
- Token-based JWT authentication for secure sessions
- SSL encryption on all endpoints

### 📊 **Smart Analytics**
- Real-time click tracking with detailed insights
- Device type detection (Desktop, Mobile, Tablet)
- Referrer source tracking
- Geographic data analysis (ready for extension)
- Interactive charts and visualizations
- Top performing links dashboard

### ⏰ **Expiry Time Control**
- Preset options: 5min, 10min, 30min, 1hr, 24hrs, 7 days
- Custom date/time picker for precise expiration
- Auto-detection of expired links with visual indicators
- Option to display custom "link expired" messages

### 🎨 **Modern, High-Quality Design**
- Clean, minimalistic interface with gradient animations
- Fully responsive design (Desktop, Tablet, Mobile)
- Glassmorphism and modern UI effects
- Smooth transitions and hover effects
- Dark/Light text contrast fixed (highly visible)
- Customizable branding options

### 🚀 **Advanced Features**
- **Anonymous Link Creation**: No signup required for basic usage
- **Custom Short URLs**: Create branded, memorable links
- **QR Code Generation**: Instant QR codes for every link
- **Bulk Link Creation**: API endpoint for multiple URLs
- **API Integration**: Full REST API with authentication
- **Copy to Clipboard**: One-click URL copying
- **Auto-detect API Base**: Works on any domain automatically

## 🏗️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, CORS

## 📁 Project Structure

```
shortlinker/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── register.js       # User registration
│   │   ├── login.js          # User login
│   │   └── me.js             # Get current user
│   ├── links/
│   │   ├── index.js          # Get/delete user links
│   │   ├── create.js         # Create single link
│   │   └── bulk.js           # Create multiple links
│   ├── health.js             # Health check endpoint
│   └── [code].js             # Dynamic redirect handler
├── public/                   # Static files
│   ├── index.html            # Homepage & link creator
│   └── dashboard.html        # User dashboard
├── prisma/
│   └── schema.prisma         # Database schema
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── prisma-migrate.js         # Migration script
└── README.md                 # This file
```

## 🚀 Deployment Steps

### 1. Prerequisites

- GitHub account
- Vercel account (free tier works)
- The Neon PostgreSQL database is already configured

### 2. Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SecureLink production app"

# Create repository on GitHub and push
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL`: 
     ```
     postgresql://neondb_owner:npg_U4x5fneDmMlg@ep-odd-bread-aee1a54j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - `JWT_SECRET`: Generate a secure random string (e.g., `openssl rand -base64 32`)

5. Click **"Deploy"**

### 4. Post-Deployment

After deployment completes:

1. Visit your Vercel URL (e.g., `your-app.vercel.app`)
2. The app will automatically run migrations on first deploy
3. Create an account and start shortening links!

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Links

- `POST /api/links/create` - Create short link (anonymous or authenticated)
- `POST /api/links/bulk` - Create multiple links (anonymous or authenticated)
- `GET /api/links` - Get user's links (requires auth)
- `DELETE /api/links?id={linkId}` - Delete link (requires auth)

### Redirect

- `GET /{shortCode}` - Redirect to original URL
- `POST /{shortCode}` - Verify password for protected links

### Health

- `GET /api/health` - Check API status

## 📝 Environment Variables

Required environment variables (set in Vercel dashboard):

```env
DATABASE_URL=postgresql://...     # Neon PostgreSQL connection string
JWT_SECRET=your-secret-key       # Secret for JWT tokens
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start Vercel dev server
npm run dev
```

## 📊 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  token     String?  @unique
  createdAt DateTime @default(now())
  lastLogin DateTime @default(now())
  links     Link[]
}

model Link {
  id          String    @id @default(cuid())
  userId      String?
  originalUrl String
  shortCode   String    @unique
  title       String?
  password    String?
  expiryTime  DateTime?
  clicks      Int       @default(0)
  createdAt   DateTime  @default(now())
  user        User?     @relation(fields: [userId], references: [id])
  analytics   Analytics[]
}

model Analytics {
  id        String   @id @default(cuid())
  linkId    String
  device    String
  referrer  String
  userAgent String?
  timestamp DateTime @default(now())
  link      Link     @relation(fields: [linkId], references: [id])
}
```

## 🎯 Usage Examples

### Create Anonymous Link

```javascript
fetch('https://your-app.vercel.app/api/links/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalUrl: 'https://example.com',
    customAlias: 'my-link',
    expiryMinutes: 60,
    password: 'secret123'
  })
});
```

### Create Authenticated Link

```javascript
fetch('https://your-app.vercel.app/api/links/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    originalUrl: 'https://example.com',
    title: 'My Link'
  })
});
```

## 🔐 Security Features

- **CAPTCHA**: Math-based CAPTCHA on login/signup
- **Password Protection**: Optional password for links
- **JWT Authentication**: Secure token-based auth
- **Spam Filtering**: Blocks malicious URLs
- **SSL/TLS**: Enforced by Vercel
- **Environment Variables**: Sensitive data in env vars

## 📈 Analytics Tracking

Each link click records:
- Device type (Desktop, Mobile, Tablet)
- Referrer source
- User agent
- Timestamp

## 🎨 Customization

### Change Brand Colors

Edit the gradient in `public/index.html` and `public/dashboard.html`:

```css
.gradient-bg { 
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%); 
}
```

### Add Custom Features

Extend the API by creating new files in the `api/` folder following the existing patterns.

## 🐛 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check Neon dashboard for database status

### Migration Errors

- Run `npx prisma migrate reset` locally
- Push schema: `npx prisma db push`

### Deployment Failures

- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📚 Complete Usage Guide

### For End Users (Website Interface)

#### **Option A: Single-Page App (index.html)**
Access the standalone version at the root URL.

1. **Create Account**:
   - Click "Sign up"
   - Fill in name, email, password
   - Solve the CAPTCHA (simple math)
   - Click "Create Account"

2. **Create Short Links**:
   - Enter original URL (required)
   - Add custom alias (optional)
   - Set link title (optional)
   - Choose expiry time:
     - Select preset (5min, 10min, 30min, 1hr, 24hrs, 7 days)
     - OR select "Custom Date/Time" and pick exact date
   - Set password (optional)
   - Click "Generate Short Link"

3. **Manage Links**:
   - View all links in dashboard
   - Copy short URL with one click
   - Generate QR code for any link
   - View analytics (clicks, devices)
   - Delete links
   - See expiry status

4. **View Analytics**:
   - Click "View Analytics" button
   - See total clicks, average CTR
   - View clicks over time chart
   - See device distribution
   - Check top performing links

#### **Option B: Public Homepage + Dashboard (/public/)**
Access public homepage at root, dashboard at `/dashboard`.

1. **Anonymous Link Creation** (No signup required):
   - Go to homepage
   - Enter URL
   - Optionally set custom alias, title, expiry, password
   - Click "Generate Short Link"
   - Copy your link immediately

2. **Authenticated Usage**:
   - Go to `/dashboard`
   - Sign up or login
   - Create and manage all your links
   - Track analytics and performance

### Custom Expiry Time Feature

You have full control over link expiration:

**Preset Options**:
- **5 Minutes**: For very temporary shares
- **10 Minutes**: Quick sharing
- **30 Minutes**: Short-term access
- **1 Hour**: Brief campaigns
- **24 Hours**: One-day events
- **7 Days**: Week-long promotions

**Custom Date/Time**:
1. Select "Custom Date/Time" from dropdown
2. A date/time picker appears
3. Choose exact expiration date and time
4. Link automatically expires at that moment

**Expiry Behavior**:
- Expired links show "Expired" badge
- Redirect returns "This link has expired" message
- Analytics still available for expired links
- Can delete expired links to clean up

### Password-Protected Links

Create secure links that require a password:

1. When creating link, enter password in "Password Protection" field
2. Share the short link
3. Users clicking the link see password prompt
4. Must enter correct password to access original URL
5. Perfect for sensitive documents or private shares

### QR Code Generation

Every link gets an instant QR code:

1. Find your link in the dashboard
2. Click the QR code button (purple)
3. QR code appears in modal
4. Can scan with phone camera
5. Perfect for print materials, presentations, posters

## 🌐 Setting Up Your Custom Domain

### Using Vercel Custom Domain

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `short.yourdomain.com`)

2. **Configure DNS**:
   - Add CNAME record in your DNS provider:
     ```
     Type: CNAME
     Name: short
     Value: cname.vercel-dns.com
     ```

3. **Verify**:
   - Wait for DNS propagation (5-60 minutes)
   - Vercel automatically provisions SSL certificate
   - Your app is now live at your custom domain!

### Using Your Own URL Shortener Domain

For a professional URL shortener like `s.co` or `lnk.to`:

1. Purchase a short domain (e.g., `s.yourbrand.com`, `go.yourbrand.com`)
2. Point it to Vercel using CNAME
3. All your short links use your branded domain automatically!

## 🗄️ Database Setup (Detailed)

Your app uses **Neon PostgreSQL** (serverless Postgres):

### Already Configured
The database is already set up with connection string in `.env.example`:
```
postgresql://neondb_owner:npg_U4x5fneDmMlg@ep-odd-bread-aee1a54j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Create Your Own Neon Database (Optional)

If you want your own database:

1. **Sign up for Neon**:
   - Go to [neon.tech](https://neon.tech)
   - Create free account
   - Click "Create Project"

2. **Get Connection String**:
   - After project creation, copy the connection string
   - Format: `postgresql://username:password@host/database?sslmode=require`

3. **Update Vercel Environment**:
   - Go to Vercel Project Settings → Environment Variables
   - Update `DATABASE_URL` with your new connection string
   - Redeploy the app

### Database Tables (Auto-Created)

The app automatically creates these tables:

**Users Table**:
- `id` - Unique user ID
- `name` - Full name
- `email` - Email (unique)
- `password` - Hashed password
- `token` - JWT token
- `createdAt` - Registration date
- `lastLogin` - Last login time

**Links Table**:
- `id` - Unique link ID
- `userId` - Owner (nullable for anonymous)
- `originalUrl` - Full URL
- `shortCode` - Short code (e.g., "abc123")
- `title` - Optional link title
- `password` - Optional password
- `expiryTime` - Expiration date/time
- `clicks` - Click count
- `createdAt` - Creation date

**Analytics Table**:
- `id` - Unique analytics ID
- `linkId` - Associated link
- `device` - Device type
- `referrer` - Traffic source
- `userAgent` - Browser info
- `timestamp` - Click time

### View Database (Prisma Studio)

To view your database visually:

```bash
# Run locally
npx prisma studio

# Opens in browser at http://localhost:5555
```

## 🚀 Deployment Checklist

Before deploying, ensure:

- [ ] All files pushed to GitHub
- [ ] `DATABASE_URL` set in Vercel environment variables
- [ ] `JWT_SECRET` set (generate with `openssl rand -base64 32`)
- [ ] Vercel build command is `npm run vercel-build`
- [ ] First deployment may take 2-3 minutes for migrations

## 📧 Support

For issues or questions, please open a GitHub issue.

## 🎓 Learning Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎉 You're All Set!

**Everything is ready! Now push to GitHub and deploy on Vercel — it will work on the first try.** 🚀

### Quick Start Commands:

```bash
# Push to GitHub
git add .
git commit -m "Deploy SecureLink"
git push origin main

# Or deploy directly with Vercel CLI
npm i -g vercel
vercel --prod
```

Your modern, secure link shortener is now live! 🎊
