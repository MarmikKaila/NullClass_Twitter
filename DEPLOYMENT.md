# Vercel Deployment Instructions

## Method 1: Automatic Deployment (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `MarmikKaila/NullClass_Twitter`
3. Configure project:
   - **Root Directory**: `twiller`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
4. Add Environment Variable:
   - **Key**: `MONGO_URI`
   - **Value**: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/twiller`)
5. Click **Deploy**

## Method 2: Manual Upload

1. Build the project locally:
   ```bash
   cd twiller
   npm install
   npm run build
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Click "Deploy" → Choose "Browse" and select the `twiller/build` folder
4. Add environment variable:
   - **Key**: `MONGO_URI`  
   - **Value**: Your MongoDB Atlas connection string
5. Deploy

## Method 3: CLI Deployment

```bash
cd twiller
vercel --prod
```

When prompted:
- Set up and deploy?: **Y**
- Which scope?: Choose your account
- Link to existing project?: **N**
- Project name?: `twiller` (or your choice)
- In which directory is your code located?: `.`
- Want to override the settings?: **N**

Then set environment variable:
```bash
vercel env add MONGO_URI
```
Paste your MongoDB connection string when prompted.

## Important Notes

✅ **Root Directory**: Set to `twiller` in Vercel dashboard  
✅ **API Routes**: All backend APIs work through `/api/*` endpoints  
✅ **Serverless**: Backend runs as serverless functions (no Express server needed)  
✅ **MongoDB**: Make sure to whitelist Vercel IPs in MongoDB Atlas (or use 0.0.0.0/0 for all)

## Environment Variables Required

- `MONGO_URI` - MongoDB Atlas connection string (required)
- `REACT_APP_API_URL` - Automatically set to `/api` in production

## Testing

After deployment, your app will be live at: `https://your-project.vercel.app`

All features should work including:
- User authentication
- Audio tweets
- Subscription payments
- Multi-language support
- Login tracking
- Notifications
