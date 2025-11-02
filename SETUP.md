# Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL to create all tables and sample data

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Your App
Navigate to `http://localhost:3000`

## 📱 Features Overview

### Dashboard
- View all projects with color-coded urgency
- Search and filter projects
- Create new projects

### Project Details
- **Overview**: Project information and timeline
- **Joinery Items**: Track items with 13-step checklist
- **Tasks**: Project-level task management
- **Materials**: Track materials and suppliers
- **Installer**: Assign installers to projects

### Color-Coded Urgency
- 🟢 Green: >10 days until install
- 🟡 Yellow: 7-10 days until install
- 🔴 Red: <7 days until install

## 🛠️ Troubleshooting

### Common Issues
1. **Database connection errors**: Check Supabase URL and keys
2. **Build errors**: Run `npm install` to ensure all dependencies are installed

### Getting Help
1. Check the main README.md for detailed documentation
2. Verify all environment variables are set correctly
3. Ensure Supabase tables are created using the schema.sql file

## 🚀 Deployment

### Railway (Recommended)
See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Other Options
- Vercel
- Netlify
- DigitalOcean App Platform

## 💰 Cost Estimates
- **Supabase**: Free tier (up to 500MB)
- **Railway**: $5/month (Hobby plan)

**Total**: ~$5/month for moderate usage


