# Custom Joinery Project Manager

A comprehensive project management application designed specifically for custom joinery businesses. Features include project tracking, joinery item management, task lists, materials tracking, and installer assignments.

## Features

### 🏗️ Project Management
- Create and manage projects with unique IDs
- Track project status, budgets, and timelines
- Color-coded installation countdown (green >10 days, yellow 7-10 days, red <7 days)
- Priority levels and client information

### 🔨 Joinery Items
- Detailed joinery item tracking with individual budgets
- Comprehensive 13-step checklist for each item:
  - Shop Drawings Approved
  - Board Ordered
  - Hardware Ordered
  - Site Measured
  - Microvellum Ready to Process
  - Processed to Factory
  - Picked up from Factory
  - Install Scheduled
  - Plans Printed
  - Assembled
  - Delivered
  - Installed
  - Invoiced

### ✅ Task Management
- Project-level task lists with checkbox completion
- Add, edit, and delete tasks
- Visual completion tracking

### 📦 Materials Management
- Track materials with thickness, board size, quantity, and supplier
- Add/edit/delete materials for each project
- Supplier information tracking

### 👷 Installer Assignment
- Assign installers to projects
- Contact information management
- Multiple installer support per project

### 🎤 Voice Assistant
- Interactive voice interface powered by OpenAI Realtime API
- Create, edit, and retrieve projects using natural language
- Real-time speech-to-speech conversations
- WebRTC-enabled for low-latency audio streaming


## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Lucide React icons

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration (for Voice Assistant feature)
OPENAI_API_KEY=your_openai_api_key_here
```

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. This will create all necessary tables and sample data

### 4. Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. Navigate to `http://localhost:3000`
2. Create your first project
3. Add joinery items, tasks, materials, and assign installers
4. Track progress using the comprehensive checklist system

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── project/[id]/     # Project details page
│   └── page.tsx          # Dashboard
├── components/            # React components
│   ├── project/          # Project-specific components
│   ├── projects/         # Project list components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
└── database/             # Database schema
```

## Key Features Explained

### Color-Coded Installation Countdown
- **Green**: More than 10 days until installation
- **Yellow**: 7-10 days until installation  
- **Red**: Less than 7 days (urgent)

### Responsive Design
- Optimized for desktop and mobile browsers
- Touch-friendly interface for mobile use
- Responsive grid layouts and navigation

## Deployment

### Railway (Recommended)

Railway is a modern platform that makes deploying Next.js apps simple. See the detailed guide in [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for step-by-step instructions.

**Quick Start:**
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add all environment variables in Railway dashboard
5. Railway will auto-detect Next.js and deploy
6. Update `NEXT_PUBLIC_APP_URL` with your Railway domain after first deployment

### Other Platforms
- Vercel
- Netlify
- DigitalOcean App Platform

## Cost Estimates

### Monthly Costs (Approximate)
- **Supabase**: Free tier (up to 500MB database)
- **Railway**: $5/month (Hobby plan, 500 hours)

**Total**: ~$5/month for moderate usage

## Support

For issues or questions:
1. Check the database schema in `database/schema.sql`
2. Verify environment variables are set correctly
3. Ensure Supabase tables are created properly
4. Check browser console for client-side errors
5. Check server logs for API errors

## Future Enhancements

- Mobile app (React Native)
- Integration with accounting software
- Advanced reporting and analytics
- Photo/document attachments
- Team collaboration features
- Automated notifications
- Calendar integration


