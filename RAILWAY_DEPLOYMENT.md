# Railway Deployment Guide

This guide will walk you through deploying your Custom Joinery Project Manager to Railway using GitHub.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your project should be pushed to GitHub
3. **Supabase Account**: Database setup (already configured)

## Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** in the top right
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account if prompted
5. Select your repository: `Project_Manager_1dot0` (or the specific project folder)
   - **Note**: If your project is in a subfolder (`project-manager`), Railway will auto-detect it, or you can specify the root directory later

## Step 2: Configure Build Settings

Railway will auto-detect Next.js, but let's verify the settings:

1. In your Railway project, go to **Settings** → **General**
2. Set the **Root Directory** to: `project-manager` (NO leading slash - just `project-manager`)
   - ⚠️ **Important**: Do NOT use `/project-manager` - Railway expects a relative path without the leading slash
3. Ensure these are set:
   - **Build Command**: `npm run build` (auto-detected)
   - **Start Command**: `npm start` (auto-detected)

**If Railway still can't find the directory:**
- Check that your GitHub repository includes the `project-manager` folder
- Verify the folder name matches exactly (case-sensitive): `project-manager`
- You can see the repository structure in Railway's deployment logs

## Step 3: Set Environment Variables

Go to **Variables** tab in Railway and add all required environment variables:

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration (for Voice Assistant feature)
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
# Railway will provide a domain like: https://your-app-name.up.railway.app
# Update this after first deployment!
NEXT_PUBLIC_APP_URL=https://your-app-name.up.railway.app
```

### Important Notes:

- **NEXT_PUBLIC_APP_URL**: Railway will automatically generate a domain. After your first deployment, update this variable with your actual Railway URL
- All `NEXT_PUBLIC_*` variables are exposed to the browser - don't put secrets there
- Railway provides a secure way to store secrets - use the Variables tab

## Step 4: Deploy

1. Once environment variables are set, Railway will automatically:
   - Detect it's a Next.js project
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Start the server (`npm start`)

2. Check the **Deployments** tab to monitor the build process
3. If there are errors, check the build logs in Railway dashboard

## Step 5: Custom Domain (Optional)

1. In Railway project → **Settings** → **Domains**
2. Click **"Generate Domain"** if not already generated
3. For custom domain:
   - Click **"Custom Domain"**
   - Enter your domain name
   - Follow Railway's DNS configuration instructions
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Troubleshooting

### Build Fails

- **Check Node.js version**: Railway uses Node 18+ by default. If you need a specific version, add a `.nvmrc` file to your project root:
  ```
  18.17.0
  ```
- **Check build logs**: Go to **Deployments** → Click on failed deployment → View logs
- **Verify environment variables**: Ensure all required variables are set

### Runtime Errors

- **Check logs**: Railway dashboard → Your service → **Logs** tab
- **Verify database connection**: Ensure Supabase credentials are correct
- **Check API routes**: Verify `NEXT_PUBLIC_APP_URL` is set correctly

### Port Issues

Railway automatically assigns a `PORT` environment variable. Next.js will use this automatically, so you don't need to configure anything.

### Environment Variables Not Working

- Ensure variable names match exactly (case-sensitive)
- `NEXT_PUBLIC_*` variables need to be set in Railway for them to be available in the browser
- Redeploy after adding/changing environment variables

## Railway Pricing

- **Hobby Plan**: $5/month - Includes 500 hours of usage
- **Pro Plan**: $20/month - Includes more resources

For a Next.js app with moderate traffic, the Hobby plan is usually sufficient.

## Updating Your Deployment

Railway automatically redeploys when you push to your connected GitHub branch:
- Push to `main` branch → Automatic deployment
- You can also manually trigger deployments from the Railway dashboard

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment on Railway](https://docs.railway.app/guides/nextjs)
- Railway Discord for support

## Quick Checklist

- [ ] GitHub repository connected to Railway
- [ ] Root directory set to `project-manager` (no leading slash)
- [ ] All environment variables configured
- [ ] First deployment successful
- [ ] `NEXT_PUBLIC_APP_URL` updated with Railway domain
- [ ] Test the deployed application

## Troubleshooting Root Directory Issues

If Railway says it can't find `/project-manager`:

1. **Check the root directory setting**: It should be `project-manager` (no leading slash)
2. **Verify repository structure**: Make sure `project-manager` folder exists in your GitHub repo
3. **Check deployment logs**: Railway shows the repository structure in the build logs
4. **Try without root directory**: If your entire repo is just the project-manager folder, you can leave root directory empty

---

**Need Help?** Check Railway's logs and build output in the dashboard for detailed error messages.

