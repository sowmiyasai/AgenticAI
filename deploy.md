# Deployment Guide for Render (Backend) and Vercel (Frontend)

This document explains how to deploy the project to Render for the Express API and Vercel for the Next.js frontend. It is intended to be used after the project is committed to GitHub.

IMPORTANT:
- Do not commit real secrets or API keys.
- Keep all sensitive values in the platform environment variables instead of in source control.
- This project already includes an example environment file, but the real values must be configured in Render and Vercel dashboards.

---

## 1. Project structure review

The repository is already split into:

- Root project folder
- client/ — Next.js frontend
- server/ — Express + Socket.IO backend

The backend is configured to read environment variables from process.env, and the frontend uses NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL values from the environment.

---

## 2. Prepare the repository for GitHub

Before deployment:

1. Ensure the project root contains the files you want to commit.
2. Make sure the following is present in the root:
   - .gitignore
   - .env.example
   - README.md
   - client/
   - server/
3. Do not commit actual `.env` files.
4. Commit only non-secret configuration and code.

The root `.gitignore` file is already configured to exclude:
- node_modules/
- .env and .env.*
- build outputs
- Vercel output
- editor artifacts

---

## 3. GitHub setup

1. Create a new GitHub repository.
2. Push the project to GitHub.
3. Do not push any real secret values.
4. Keep `.env.example` as the template for required variables.

Example push flow:

```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

---

## 4. Deploy the backend to Render

### Step 1: Create a new Render Web Service

1. Sign in to Render.
2. Click New + → Web Service.
3. Connect your GitHub repository.
4. Select the repository for this project.
5. Choose the root folder as the service root.

### Step 2: Configure the backend build settings

Use the following values:

- Name: agentflow-ai-backend
- Runtime: Node
- Region: choose the closest to your users
- Branch: main
- Root Directory: leave blank unless you want a different root path
- Build Command:

```bash
npm install
```

- Start Command:

```bash
cd server && npm install && node src/server.js
```

If Render allows running from the root folder without `cd server`, then the safer option is to keep the server app as a separate service with the server folder as the root directory. In that case, use:

- Root Directory: server
- Build Command:

```bash
npm install
```

- Start Command:

```bash
node src/server.js
```

### Step 3: Add backend environment variables in Render

In the Render dashboard, create environment variables for the backend service. Do not paste secrets into this file or into GitHub.

Required values:

```env
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
JWT_SECRET=replace_with_a_secure_random_secret
CREDENTIAL_ENCRYPTION_KEY=replace_with_a_32_character_key
MONGODB_URI=your_mongodb_atlas_uri_or_private_db_uri
REDIS_URL=your_redis_url_or_leave_blank_if_not_used
USE_IN_MEMORY_DB=false
USE_IN_MEMORY_REDIS=false
OPENROUTER_API_KEY=
GEMINI_API_KEY=

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/integrations/oauth/gmail/callback

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/integrations/oauth/slack/callback

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/integrations/oauth/discord/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/integrations/oauth/google-sheets/callback
```

Notes:
- Replace `your-render-backend-url` with the actual Render URL after the service is created.
- If you are not using MongoDB or Redis in production yet, you may temporarily keep the in-memory fallback values enabled.
- The actual credential values should be set only through Render’s Environment Variables panel.

### Step 4: Deploy backend

1. Click Create Web Service.
2. Render will trigger the build and deployment.
3. After deployment completes, copy the backend URL.
4. You will need this URL for the frontend environment variables and OAuth callbacks.

### Step 5: Health check

Open the deployed backend URL and verify:

```text
https://your-render-backend-url.onrender.com/api/health
```

You should receive a JSON object with status and environment details.

---

## 5. Deploy the frontend to Vercel

### Step 1: Create a Vercel project

1. Sign in to Vercel.
2. Click Add New Project.
3. Import the GitHub repository.
4. Vercel will detect the frontend app in the client folder if the project is configured accordingly.

If Vercel does not detect it automatically, use these settings:

- Framework: Next.js
- Root Directory: client
- Build Command: `npm install && npm run build`
- Output Directory: `.next`

### Step 2: Add frontend environment variables

In the Vercel dashboard, add the following environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-render-backend-url.onrender.com
```

Do not add secret values here unless they are explicitly public frontend values.

### Step 3: Deploy frontend

1. Click Deploy.
2. Wait for the build to finish.
3. Copy the generated Vercel frontend URL.
4. Add it back into the backend `CLIENT_URL` environment variable on Render.

---

## 6. Final cross-environment configuration

After both services are live:

1. Backend Render URL is available.
2. Frontend Vercel URL is available.
3. Backend `CLIENT_URL` is set to the Vercel frontend URL.
4. Frontend `NEXT_PUBLIC_API_URL` points to the Render backend.
5. Frontend `NEXT_PUBLIC_SOCKET_URL` points to the Render backend.

Example:

```env
CLIENT_URL=https://agentflow-ai-frontend.vercel.app
NEXT_PUBLIC_API_URL=https://agentflow-ai-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://agentflow-ai-backend.onrender.com
```

---

## 7. OAuth callback setup

For Gmail, Slack, Discord, and Google Sheets, configure the OAuth redirect URLs to match the deployed backend host.

Example:

```text
https://your-render-backend-url.onrender.com/api/integrations/oauth/gmail/callback
https://your-render-backend-url.onrender.com/api/integrations/oauth/slack/callback
https://your-render-backend-url.onrender.com/api/integrations/oauth/discord/callback
https://your-render-backend-url.onrender.com/api/integrations/oauth/google-sheets/callback
```

You must also add the same callback URLs in the respective provider developer consoles.

---

## 8. Render-specific production notes

Render can serve the backend correctly as long as the Node service is configured with the proper start command and environment variables.

If your app uses a local MongoDB or Redis connection in development, production should instead use secure hosted services such as:
- MongoDB Atlas
- Redis Cloud
- Render Redis add-on if available

---

## 9. Common troubleshooting

### Backend fails to start

Check:
- Node version is compatible
- Build command ran successfully
- PORT environment variable is available
- `process.env` values are correctly set

### Frontend cannot reach API

Check:
- `NEXT_PUBLIC_API_URL` is correct
- backend CORS is configured for the Vercel domain
- backend `CLIENT_URL` matches the frontend domain

### OAuth errors

Check:
- callback URLs match exactly in the provider dashboard
- backend environment variables include the correct client IDs and secrets
- redirect URIs use the deployed backend URL, not localhost

---

## 10. Final deployment checklist

Before calling the deployment complete, verify:

- [ ] GitHub repo is pushed without secrets
- [ ] Render backend service is live
- [ ] Vercel frontend is live
- [ ] Backend health endpoint works
- [ ] Frontend loads without API errors
- [ ] CORS is configured for Vercel domain
- [ ] MongoDB and Redis configs are valid for production
- [ ] OAuth callback URLs are set in the provider consoles
- [ ] `.env` files remain local only and are not committed

---

## 11. Recommended next actions

After deployment, validate the live app by:

1. Creating a user account
2. Logging in
3. Generating or creating a workflow
4. Triggering an execution
5. Testing integrations and notification flow

That confirms the frontend, backend, and real-time event layer are working end-to-end in production.
