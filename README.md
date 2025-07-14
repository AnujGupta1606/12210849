# URL Shortener

A simple React application for shortening URLs with custom codes and analytics.

## Screenshots

### Main Interface
![URL Shortener Interface](./screenshots/main-interface.png)

### Statistics Dashboard
![Statistics Dashboard](./screenshots/statistics.png)

## Features

- URL shortening with custom short codes
- Expiry time settings (default 30 minutes)
- Click tracking and basic analytics
- Local storage for data persistence
- Material-UI interface

## Setup

```bash
npm install
npm start
```

Open http://localhost:3000 to view the app.

## How to Use

1. **Shorten URLs**: Enter a URL and optionally provide a custom short code
2. **Set Expiry**: Choose how long the link should be valid (in minutes)
3. **View Stats**: Check the Statistics page to see all your shortened URLs
4. **Copy Links**: Click copy button to copy short URLs to clipboard

## Built With

- React + TypeScript
- Material-UI
- React Router
- Local Storage

## Project Structure

```
src/
├── components/     # React components
├── services/      # URL management logic
├── types/         # TypeScript definitions
└── utils/         # Helper functions
```

## Live Demo

🔗 **Try it live**: [URL Shortener App](https://anujgupta1606.github.io/12210849/)

## Preview

| Feature | Preview |
|---------|---------|
| URL Shortening | Clean and simple interface for creating short URLs |
| Custom Codes | Option to create personalized short codes |
| Analytics | Track clicks and manage your URLs |
| Responsive | Works perfectly on desktop and mobile |
