# Liquidation Alert

A minimal Node.js + Express API server for the **liquidation-alert** hackathon project.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (includes `npm`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This reads `package.json` and downloads Express into the `node_modules/` folder.

### 2. Start the server

```bash
npm start
```

You should see:

```
Liquidation Alert server running at http://localhost:3000
```

### 3. Test the endpoint

Open your browser and navigate to:

```
http://localhost:3000/risk-alert
```

Or use `curl` from a terminal:

```bash
curl http://localhost:3000/risk-alert
```

Expected response:

```json
{ "status": "ok", "data": "test" }
```

## Project Structure

```
├── package.json   # Project manifest & dependency list
├── server.js      # Main entry point — Express server & routes
├── .gitignore     # Files excluded from Git
└── README.md      # This file
```

## License

MIT
