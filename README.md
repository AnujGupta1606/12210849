# URL Shortener

A simple React application for shortening URLs with custom codes and analytics.

## Screenshots

### Main Interface
<img width="1914" height="908" alt="Screenshot 2025-07-14 112129" src="https://github.com/user-attachments/assets/0a799cda-20f8-4eca-b4ef-e27315baa91c" />


### Statistics Dashboard

<img width="1891" height="896" alt="Screenshot 2025-07-14 112202" src="https://github.com/user-attachments/assets/84e0b762-b4d9-42a8-bc18-73d4b8ee68f1" />

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


