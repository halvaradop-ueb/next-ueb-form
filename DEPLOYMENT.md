# Deployment Guide

This guide explains how to deploy the UEB Evaluation System to a production environment.

## Prerequisites

1. A Vercel account
2. A Supabase account with the project configured
3. Environment variables (see below)

## Environment Variables

### Web Application (`apps/web/.env.production`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AUTH_SECRET=your_auth_secret
NEXT_PUBLIC_API_URL=/api
```

### API Application (`apps/api/.env.production`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_service_key
FRONTEND_URL=https://your-app.vercel.app
PORT=4000
```

## Deployment to Vercel

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure the project settings:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

4. Add the environment variables to Vercel project settings

## Monorepo Configuration

This project uses a monorepo structure with Turborepo. The `vercel.json` file at the root configures how Vercel handles the monorepo.

## API Deployment

The API is now deployed as serverless functions alongside the Next.js application using Next.js API routes. This replaces the separate Express API server.

## Troubleshooting

### No Page Data Showing

If your deployed application isn't showing any page data:

1. Check that all environment variables are correctly set in Vercel
2. Verify that the `NEXT_PUBLIC_API_URL` is set to `/api` for Vercel deployments
3. Ensure that the Supabase credentials are correct
4. Check the browser console for any errors
5. Check the Vercel function logs for any API errors

### CORS Issues

If you encounter CORS issues:

1. Verify that the `FRONTEND_URL` environment variable in the API is set correctly
2. Check that the CORS configuration in `apps/api/src/index.ts` matches your frontend URL

## Local Development vs Production

In local development:

- API runs on `http://localhost:4000/api/v1`
- Web app runs on `http://localhost:3000`

In production:

- API is served as serverless functions using Next.js API routes
- Web app is served by Vercel
- API endpoint is `/api` (relative to the web app)
