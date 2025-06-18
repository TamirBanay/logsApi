# 🚀 ESP32 Alarm System - Server Deployment Guide

## 🌟 Overview
This guide will help you deploy the ESP32 Alarm System API server to free hosting services.

## 📋 Prerequisites
- Node.js project files
- MongoDB Atlas account (free tier)
- Git repository (GitHub recommended)

## 🎯 Recommended Free Hosting Services

### 1. 🚄 Railway (Recommended)
**Why Railway?** Simple deployment, great free tier, automatic HTTPS

#### Steps:
1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your GitHub account
3. **Deploy Project**:
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```
4. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
5. **Select Repository**: Choose your ESP32 project repository
6. **Configure Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Railway auto-assigns)

#### Railway Configuration File (`railway.toml`):
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 2. 🎨 Render
**Why Render?** Reliable, good free tier, easy setup

#### Steps:
1. **Create Account**: Go to [render.com](https://render.com)
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Link your GitHub repo
4. **Configure**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
5. **Add Environment Variables**:
   - `MONGODB_URI`
   - `NODE_ENV=production`

### 3. ⚡ Vercel (Serverless Functions)
**Note**: Requires adapting to serverless architecture

#### Steps:
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Create vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "NODE_ENV": "production"
  }
}
```
3. **Deploy**: `vercel --prod`

### 4. 🐙 Heroku (Classic)
**Note**: Heroku removed free tier but still popular

#### Using Docker (heroku.yml exists):
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set stack to container
heroku stack:set container

# Set environment variables
heroku config:set MONGODB_URI="your-mongodb-connection-string"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 🗄️ MongoDB Setup
1. **Create MongoDB Atlas Account**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Free Cluster**: Choose M0 (free tier)
3. **Create Database User**: Username + Password
4. **Whitelist IP**: Add `0.0.0.0/0` for global access
5. **Get Connection String**: Replace `<password>` with your password

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/esp32_alarm?retryWrites=true&w=majority
```

## 🛠️ Pre-Deployment Checklist

### 1. Update package.json
```json
{
  "name": "alerm-system-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### 2. Environment Variables Template
Create `.env.example`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=3000
NODE_ENV=production
LATEST_VERSION=0.2.0
```

### 3. Test Locally
```bash
# Install dependencies
npm install

# Start server
npm start

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/api/getLastVersion
```

## 🌐 Quick Deploy Commands

### Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
railway link

# Deploy
railway up
```

### Render:
```bash
# Just push to GitHub, then:
# 1. Go to render.com
# 2. Connect repo
# 3. Deploy
```

### Railway One-Click:
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

## 🔧 Post-Deployment

### 1. Update ESP32 Code
Replace server URL in ESP32 code:
```cpp
const char* SERVER_BASE_URL = "https://your-app-name.railway.app/api/";
```

### 2. Test API Endpoints
```bash
# Health check
curl https://your-app-name.railway.app/

# Get version
curl https://your-app-name.railway.app/api/getLastVersion

# Get modules
curl https://your-app-name.railway.app/api/getModuels
```

### 3. Monitor Logs
- **Railway**: Dashboard → Logs tab
- **Render**: Dashboard → Logs
- **Vercel**: Dashboard → Functions → View Logs

## 🎛️ Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port (auto-set by host) | `3000` |
| `NODE_ENV` | Environment | `production` |
| `LATEST_VERSION` | Firmware version | `0.2.0` |

## 🚨 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution**: Check connection string, whitelist IPs, verify credentials

### Issue: Port Already in Use
**Solution**: Use `process.env.PORT` (already configured)

### Issue: Build Failed
**Solution**: Check package.json scripts, ensure all dependencies listed

### Issue: API Not Responding
**Solution**: Check logs, verify environment variables, test locally first

## 📊 Free Tier Limitations

| Service | RAM | Storage | Bandwidth | Sleep |
|---------|-----|---------|-----------|-------|
| Railway | 512MB | 1GB | 100GB | No |
| Render | 512MB | - | 100GB | Yes (30min) |
| Vercel | 1GB | 1GB | 100GB | No |

## 🔗 Useful Links
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Vercel Docs](https://vercel.com/docs)

## 🆘 Support
If you encounter issues:
1. Check logs in your hosting platform
2. Verify environment variables
3. Test API endpoints
4. Check MongoDB connection

## 🎉 Success!
Once deployed, your ESP32 modules can connect to:
```
https://your-app-name.railway.app/api/
```

Update your ESP32 code with the new URL and enjoy your cloud-hosted alarm system! 🚀 