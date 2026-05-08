# RodeRescue Frontend

Frontend application for **Road Rescue**, a two-sided roadside assistance platform built with Angular.

## What this app does

- User and service-provider login/signup flows
- Protected app routes with JWT-based route guarding
- User dashboard and contact form (EmailJS integration)
- Service discovery grouped by category and prioritized by location
- Service request lifecycle (request, dispatch, reject, complete)
- Real-time notifications and provider tracking via Socket.IO
- Service-provider dashboard, team assignment, and live map tracking
- Service management (add/list/delete provider services)
- Light/dark theme persistence

## Tech stack

- Angular 21 (standalone components, lazy loading)
- TypeScript + RxJS
- Socket.IO client
- Leaflet maps
- EmailJS browser SDK
- Docker + Nginx (production serving)

## Repository structure

```text
src/
  app/
    accesspoint/                 # login/signup views
    user-components/             # user dashboard, services, tracking page
    service-provider-components/ # provider dashboard and service management
    apps-services/               # API, socket, tracking, theme, data transforms
    environments/                # production + development endpoint configs
    app.routes.ts                # route definitions and lazy-loaded pages
```

## Prerequisites

- Node.js 20+
- npm 10+

## Local setup

```bash
npm ci
npm start
```

Open `http://localhost:4200`.

> Development mode uses `src/app/environments/environment.development.ts` (`http://localhost:3000` backend by default).

## Available scripts

```bash
npm start   # ng serve (development)
npm run build
npm run watch
npm test
```

### Notes on tests

`npm test` currently fails if no `*.spec.ts` files exist (TypeScript error TS18003). Add tests under `src/**/*.spec.ts` to enable Karma test execution.

## Environment configuration

Main config files:

- `src/app/environments/environment.ts` (production)
- `src/app/environments/environment.development.ts` (local/dev)

These define:

- REST API endpoints
- Socket.IO URL
- EmailJS identifiers (`serviceID`, `templateID`, `publicKey`)

## Routing overview

Public routes:

- `/user-login`
- `/service-provider-login`

Protected routes (wrapped by `NavbarComponent` + `authGuard`):

- `/dashboard`
- `/services`
- `/track-provider`
- `/sp-dashboard`
- `/service-management`
- `/about`, `/contact` (scroll sections on dashboard)

## Docker deployment

Build and run with Docker Compose:

```bash
docker compose up --build
```

The app is served by Nginx on `http://localhost:4200` with SPA fallback (`try_files ... /index.html`).
