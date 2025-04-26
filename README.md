# Sales Gemini Chat

A chat application for sales teams to help provide information to clients about their app ideas or app improvements using the Gemini API.

## Features

- Client selection (new app idea or app improvement)
- Audit type selection for new app ideas (UI, UX, General)
- Predefined questions based on audit type
- Chat history per client
- Modern and responsive UI
- Powered by Google's Gemini API

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account with Gemini API access
- Gemini API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sales-gemini-chat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application and enter the client's name
2. Select whether the client has a new app idea or needs app improvement
3. For new app ideas:
   - Select the type of audit (UI, UX, or General)
   - The system will provide predefined questions
   - Copy these questions and send them to the client
   - Paste the client's responses in the chat
4. For app improvements:
   - Start the conversation directly
   - The AI will help analyze and provide suggestions

## Deployment

The application is ready to be deployed to Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Google Gemini API
- Vercel (for deployment)
