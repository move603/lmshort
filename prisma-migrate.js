/**
 * Prisma Migration Script for Vercel Deployment
 * 
 * This script runs database migrations on Vercel deployment
 * It's called during the build process via vercel-build script
 */

const { execSync } = require('child_process');

console.log('🔄 Running Prisma migrations...');

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  // Run migrations
  console.log('🚀 Deploying migrations...');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
