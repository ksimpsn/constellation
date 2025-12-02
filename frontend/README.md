# Constellation Frontend

A modern React-based frontend application for the Constellation distributed computing platform. This application provides a beautiful and intuitive interface for users to participate in distributed computing projects, manage their profiles, and contribute to scientific research.

## Features

- **Modern UI**: Beautiful gradient backgrounds and glassmorphism effects
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Cross-Platform**: Supports both web browsers and native desktop applications via Electron
- **Type-Safe**: Built with TypeScript for better development experience
- **Fast Development**: Powered by Vite for lightning-fast hot module replacement

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** for cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd constellation/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   # For web development only
   npm run dev:web

   # For full development (web + electron)
   npm run dev
   ```

4. **Open your browser**

   The application will be available at `http://localhost:5173`

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start the web development server only |
| `npm run dev:electron` | Start the Electron development environment |
| `npm run dev` | Start both web and Electron development servers concurrently |
| `npm run build:web` | Build the web application for production |
| `npm run build:electron` | Build the Electron desktop application |
| `npm run build` | Build both web and Electron applications |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, icons, and other assets
│   ├── components/        # Reusable React components
│   │   ├── GradientBackground.tsx
│   │   ├── Navbar.tsx
│   │   └── ProfileMenu.tsx
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   ├── Why.tsx
│   │   └── ...
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── electron/              # Electron-specific files
│   ├── main.cjs
│   └── preload.cjs
├── dist/                  # Built web application (generated)
├── release/               # Built desktop applications (generated)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Building for Production

### Web Application

```bash
npm run build:web
```

This creates an optimized production build in the `dist/` directory.

### Desktop Application (Electron)

```bash
npm run build:electron
```

This creates platform-specific desktop applications in the `release/` directory.

### Combined Build

```bash
npm run build
```

Builds both web and desktop applications.

## Configuration

### Vite Configuration

The application uses Vite for fast development and optimized builds. Configuration can be found in `vite.config.ts`.

### TypeScript Configuration

TypeScript configurations are split into:
- `tsconfig.app.json` - Application code configuration
- `tsconfig.node.json` - Build tools configuration

### Electron Configuration

Electron build configuration is defined in `package.json` under the `build` section.

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use meaningful component and variable names
- Keep components small and focused on single responsibilities

### Component Structure

- Place reusable components in `src/components/`
- Page components go in `src/pages/`
- Use TypeScript interfaces for component props

### Styling

- Use inline styles with React.CSSProperties for component-specific styling
- Follow the existing gradient background and glassmorphism design patterns
- Ensure responsive design across different screen sizes

## Deployment

### Web Deployment

The built web application (in `dist/`) can be deployed to any static hosting service such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Desktop Deployment

The built desktop applications (in `release/`) can be distributed via:
- Direct download from your website
- App stores (Microsoft Store, Mac App Store)
- Auto-updaters like Electron's autoUpdater

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Git**: Any recent version

## Troubleshooting

### Common Issues

**Port 5173 already in use**
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
# Or use a different port
npm run dev:web -- --port 5174
```

**Electron build fails**
- Ensure you have the correct Node.js version
- Try clearing node_modules and reinstalling: `rm -rf node_modules && npm install`

**TypeScript errors**
- Run `npm run lint` to check for issues
- Ensure all dependencies are installed correctly

## License

This project is part of the Constellation distributed computing platform. See the main project license for details.

## Support

For questions or support, please refer to the main Constellation project documentation or create an issue in the repository.
