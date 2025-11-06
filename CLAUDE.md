# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bruno is an open-source API client desktop application built with Electron and React. It stores API collections locally as plain text files in a custom "Bru" markup language, enabling version control via Git. The project is offline-only with no cloud sync.

## Monorepo Structure

This is an **npm workspaces** monorepo with 16 packages:

### Core Applications
- **bruno-app**: React frontend (Rsbuild, Redux Toolkit, Tailwind CSS, CodeMirror)
- **bruno-electron**: Electron main process (handles IPC, file system, network requests)
- **bruno-cli**: Command-line interface (`@usebruno/cli` package, `bru` binary)

### Core Libraries
- **bruno-lang**: Parser for .bru file format using Ohm.js grammar
- **bruno-filestore**: File system operations for .bru files
- **bruno-js**: JavaScript runtime for pre/post-request scripts with sandboxing (vm2, nodevm, quickjs)
- **bruno-requests**: HTTP, gRPC, and WebSocket client implementations
- **bruno-schema**: Yup validation schemas
- **bruno-common**: TypeScript utilities, interpolation logic
- **bruno-query**: Query utilities
- **bruno-converters**: Import/export for Postman, Insomnia, etc.
- **bruno-graphql-docs**: GraphQL schema documentation renderer
- **bruno-openapi-docs**: OpenAPI schema documentation renderer
- **bruno-toml**: TOML parsing
- **bruno-tests**: Express mock server for E2E tests (port 8081)

## Development Setup

### Initial Setup
```bash
# Use Node.js v22 (required)
nvm use

# Install dependencies
npm i --legacy-peer-deps

# Build all packages and setup sandbox libraries
npm run setup
```

### Running Locally

**Option 1: Two terminals**
```bash
# Terminal 1: Start React dev server (port 3000)
npm run dev:web

# Terminal 2: Start Electron app
npm run dev:electron
```

**Option 2: Concurrent**
```bash
npm run dev
```

### Custom Electron userData Path
```bash
ELECTRON_USER_DATA_PATH=$(realpath ~/Desktop/bruno-test) npm run dev:electron
```

## Common Commands

### Building Packages

Packages must be built in dependency order:

```bash
# Individual packages
npm run build:graphql-docs
npm run build:openapi-docs
npm run build:bruno-query
npm run build:bruno-common
npm run build:bruno-converters
npm run build:bruno-requests
npm run build:bruno-filestore

# Bundle JS sandbox libraries (required for bruno-js)
npm run sandbox:bundle-libraries --workspace=packages/bruno-js

# Build web assets
npm run build:web

# Build Electron app (builds web first, then packages)
npm run build:electron
```

### Testing

**Unit Tests (Jest)**
```bash
# Run tests for specific package
npm run test --workspace=packages/bruno-schema
npm run test --workspace=packages/bruno-common
npm run test --workspace=packages/bruno-electron

# Run all workspace tests
npm test --workspaces --if-present
```

**E2E Tests (Playwright)**
```bash
# Run main E2E tests (excludes SSL tests)
npm run test:e2e

# Run SSL-specific tests
npm run test:e2e:ssl

# Generate Playwright codegen
npm run test:codegen
```

Note: Playwright automatically starts both the bruno-app dev server (port 3000) and bruno-tests mock API server (port 8081).

### Linting
```bash
# Check all files
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Running Single Tests

**Jest (unit tests)**
```bash
# Run specific test file
npm test --workspace=packages/bruno-lang -- path/to/test.spec.js

# Run with pattern
npm test --workspace=packages/bruno-electron -- --testNamePattern="should handle request"
```

**Playwright (E2E tests)**
```bash
# Run specific test file
npx playwright test tests/collection/import.spec.ts

# Run with grep pattern
npx playwright test --grep "should import collection"

# Run in UI mode for debugging
npx playwright test --ui
```

## Architecture

### Package Dependencies
```
bruno-electron & bruno-cli
  ├─> bruno-filestore ──> bruno-lang
  ├─> bruno-js ──> bruno-common, bruno-query
  ├─> bruno-requests
  ├─> bruno-converters ──> bruno-schema
  └─> bruno-common

bruno-app
  ├─> bruno-common
  ├─> bruno-graphql-docs
  └─> bruno-schema
```

### IPC Communication Pattern
- React app communicates with Electron main process via `window.ipcRenderer.invoke()`
- IPC handlers organized in `packages/bruno-electron/src/ipc/`:
  - `collection.js` - Collection/folder/request management
  - `network/` - HTTP, gRPC, WebSocket requests
  - `filesystem.js` - File operations
  - `preferences.js` - User preferences
  - `global-environments.js` - Global variables

### State Management (Redux)
Located in `packages/bruno-app/src/providers/ReduxStore/`:
- **slices/**: app, collections, tabs, notifications, globalEnvironments, logs, performance, hookTopBar, history, trace
- **middleware/**: tasksMiddleware, draftDetectMiddleware, debugMiddleware (dev only)

### Request Execution Pipeline
1. Parse .bru file (bruno-filestore)
2. Interpolate variables (bruno-common)
3. Execute pre-request script (bruno-js)
4. Configure request with auth/proxy (bruno-requests)
5. Execute HTTP/gRPC/WS request
6. Execute post-request script and tests (bruno-js)
7. Save response and update UI

### Bru File Format
Custom plain-text DSL for API requests (parsed by bruno-lang):

```bru
meta {
  name: Login Request
  type: http
  seq: 3
}

post {
  url: https://api.example.com/login
  body: json
  auth: none
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "username": "user",
    "password": "pass"
  }
}

tests {
  test("Status is 200", function() {
    expect(res.getStatus()).to.equal(200);
  });
}
```

## Making Changes

### Workflow
1. Make changes in relevant package
2. For library packages: `npm run build --workspace=packages/<package-name>`
3. For bruno-app: dev server auto-reloads
4. For bruno-electron: restart electron process
5. Run tests: `npm test --workspace=packages/<package-name>`

### Adding Dependencies
```bash
npm i <package> --workspace=packages/<workspace-name> --legacy-peer-deps
```

### Branch Naming
- Feature branches: `feature/<feature-name>` (e.g., `feature/dark-mode`)
- Bug fixes: `bugfix/<bug-name>` (e.g., `bugfix/response-parsing`)

## Key Technologies

- **Frontend**: React 19 with React Compiler, Rsbuild, Tailwind CSS, styled-components, CodeMirror 5
- **Backend**: Electron 37.6.1, Axios, Chokidar (file watching)
- **State**: Redux Toolkit
- **Build**: Rollup (libraries), Rsbuild (bruno-app), electron-builder
- **Testing**: Jest (unit), Playwright (E2E)
- **Language**: TypeScript (bruno-common, bruno-query, bruno-requests, bruno-filestore), JavaScript (others)

## Important Conventions

### File Organization
Library packages follow this structure:
```
packages/<package-name>/
  ├── src/          # Source code
  ├── dist/         # Built output (cjs/ and esm/)
  ├── rollup.config.js
  ├── jest.config.js
  ├── tsconfig.json (if TypeScript)
  └── package.json
```

### Naming
- Packages: `@usebruno/<name>`
- Files: kebab-case
- Components: PascalCase
- Redux slices: camelCase

### Pre-commit Hooks
- nano-staged runs `npm run lint:fix` on staged .js, .ts, .jsx files
- Managed via husky

## Troubleshooting

### "Unsupported platform" error
Delete all `node_modules` and `package-lock.json`, then reinstall:
```bash
find ./ -type d -name "node_modules" -print0 | while read -d $'\0' dir; do rm -rf "$dir"; done
find . -type f -name "package-lock.json" -delete
npm i --legacy-peer-deps
```

### Package build order matters
If you get import errors, rebuild packages in dependency order (see Building Packages section).

### Electron won't start
Ensure bruno-app is built first: `npm run build:web`

## Key Files

- `package.json` - Root workspace configuration
- `playwright.config.ts` - E2E test configuration
- `eslint.config.js` - Linting rules
- `packages/bruno-app/rsbuild.config.mjs` - Frontend build config
- `packages/bruno-electron/electron-builder-config.js` - Electron packaging
- `scripts/setup.js` - Initial project setup script
- `scripts/build-electron.js` - Electron build orchestration

## Script Sandboxing

bruno-js supports three sandbox modes for executing user scripts:
- **vm2** (default): Isolated V8 context
- **nodevm**: Node.js VM with controlled access (beta)
- **quickjs** (safe mode): QuickJS WASM for maximum isolation

Configured in Electron preferences, affects pre/post-request script execution.

## Testing Notes

- E2E tests use .bru files as fixtures (located in `tests/` directory)
- Playwright runs with `workers: 1` (not parallel) to avoid conflicts
- bruno-tests mock server provides endpoints for: auth, echo, multipart, redirect, websockets
- SSL tests separated due to certificate generation requirements
- CI retries: 2, Local retries: 0
