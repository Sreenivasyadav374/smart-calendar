# Smart Calendar - AI-Powered Task Scheduler

A modern, intelligent calendar application with AI-powered task suggestions, Google Calendar integration, and seamless task management.

## Features

- 🤖 AI-powered task suggestions
- 📅 Google Calendar integration
- 📱 Progressive Web App (PWA)
- 🌙 Dark/Light theme support
- 📊 Weekly productivity summaries
- 🔄 Offline support with IndexedDB
- 📱 Responsive design
- 🎯 Smart task categorization
- ⏰ Natural language processing for task creation

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB
- **Calendar**: FullCalendar
- **Authentication**: Google OAuth2
- **AI**: OpenAI GPT-3.5
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   - `VITE_GOOGLE_CLIENT_ID`: Google OAuth2 client ID
   - `VITE_GOOGLE_API_KEY`: Google API key
   - `VITE_OPENAI_API_KEY`: OpenAI API key
   - `MONGODB_URI`: MongoDB connection string

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the backend server** (in a separate terminal)
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Deployment to Vercel

### Prerequisites

1. **MongoDB Atlas Account**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string

2. **Google Cloud Console Setup**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Calendar API and Google+ API
   - Create OAuth2 credentials
   - Add your Vercel domain to authorized origins

3. **OpenAI API Key** (optional)
   - Get your API key from [OpenAI](https://platform.openai.com/)

### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the project**
   ```bash
   vercel
   ```

4. **Set up environment variables in Vercel**
   
   Go to your Vercel dashboard → Project → Settings → Environment Variables
   
   Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-calendar
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_API_KEY=your_google_api_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

5. **Update Google OAuth settings**
   - Add your Vercel domain to authorized JavaScript origins
   - Add your Vercel domain to authorized redirect URIs

6. **Redeploy**
   ```bash
   vercel --prod
   ```

### Project Structure for Vercel

```
smart-calendar/
├── api/                    # Vercel serverless functions
│   ├── tasks.js           # Tasks API endpoint
│   ├── events.js          # Events API endpoint
│   └── categories.js      # Categories API endpoint
├── src/                   # React frontend
├── public/               # Static assets
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth2 client ID | Yes |
| `VITE_GOOGLE_API_KEY` | Google API key | Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key | Optional |
| `VITE_APP_URL` | Your app's URL | Yes |

### Troubleshooting

1. **CORS Issues**: Make sure your Vercel domain is added to Google OAuth settings
2. **Database Connection**: Verify your MongoDB connection string and whitelist Vercel's IP ranges
3. **Environment Variables**: Ensure all required environment variables are set in Vercel
4. **Build Errors**: Check the build logs in Vercel dashboard

### Features in Production

- ✅ Serverless API endpoints
- ✅ MongoDB Atlas integration
- ✅ Google Calendar sync
- ✅ AI task suggestions (if OpenAI key provided)
- ✅ PWA capabilities
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments from Git

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details