# OpenCode Web Terminal

A powerful web-based terminal emulator with iSH-like interface, custom keyboard, and VS Code integration.

## Features

- **Terminal Emulator**: Full-featured terminal with command execution
- **Custom Keyboard**: Special keys (Ctrl, Esc, Tab, Alt, arrows) with mobile support
- **Mobile Optimized**: Auto-hide keyboard, responsive design
- **VS Code Integration**: Connect directly from VS Code
- **Paste Support**: Easy clipboard access
- **Railway Deployment**: Ready for cloud deployment

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Open your browser and navigate to `http://localhost:3000`

## VS Code Integration

1. Install the extension from the `vscode-extension` directory
2. Use the command `OpenCode: Connect to Terminal`
3. Enter your server URL

## Railway Deployment

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway init` then `railway up`

## Development

- Server: `server.js`
- Frontend: `public/` directory
- VS Code Extension: `vscode-extension/` directory

## License

MIT