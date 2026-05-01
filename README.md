# Fuse

Fuse is a multi-service real-time collaboration platform built as a monorepo. It combines a React frontend, NestJS services, a Go subscriptions service, background workers, and Nginx as the public entry point.

## What the platform does

Fuse is centered around room-based collaboration and adjacent product workflows:

- Create, join, leave, and manage rooms in real time
- Synchronize room activity state across connected clients
- Send socket-driven room events and attendee updates
- Handle user authentication and authorization flows
- Deliver in-app and email notifications for room and product events
- Manage subscription and billing flows
- Provide room search and scheduling support
- Offload asynchronous work to background workers

## Architecture

Fuse is organized as a service-oriented monorepo. Each top-level folder owns its own runtime, dependencies, and deployment config.

### Frontend

- Location: `frontend/`
- Stack: TanStack Start, React, TanStack Router, TanStack Store, Tailwind CSS
- Responsibilities:
  - Render the user interface
  - Handle realtime socket interactions
  - Integrate with backend APIs and Supabase where required
  - Support rich UI experiences for rooms, chats, video-related features, and account flows

### Backend

- Location: `backend/`
- Stack: NestJS, TypeScript, PostgreSQL, Redis, Socket.IO, TypeORM
- Responsibilities:
  - Core room lifecycle and attendee management
  - Realtime room events and activity synchronization
  - Room scheduling and room search
  - JWT-based auth integration
  - Redis-backed ephemeral room state and activity data

### Authentication

- Location: `auth/`
- Stack: Node.js/TypeScript
- Responsibilities:
  - Auth-related endpoints and token handling
  - Support login and session flows used by the rest of the platform

### Notifications

- Location: `notifications/`
- Stack: NestJS, PostgreSQL, Redis, BullMQ, Socket.IO
- Responsibilities:
  - Queue and deliver notifications
  - Support in-app, email, and event-driven notification workflows
  - Serve as a dedicated notification service instead of embedding all delivery logic in the backend

### Subscriptions

- Location: `subscriptions/`
- Stack: Go, Echo, pgx, Razorpay
- Responsibilities:
  - Subscription and billing APIs
  - Payment-related flows and plan management
  - Persistence through PostgreSQL

### Workers

- Location: `workers/`
- Responsibilities:
  - Background processing for notifications and room-related tasks
  - Decouple long-running or asynchronous work from request/response services

### Nginx

- Location: `nginx/`
- Responsibilities:
  - Reverse proxy and public traffic entry point
  - Route requests to the correct service
  - Serve as the edge layer for development and production deployments

## Repository layout

- `frontend/` - client application
- `backend/` - core room and collaboration API
- `auth/` - authentication service
- `notifications/` - notification service
- `subscriptions/` - billing and subscription service
- `workers/` - asynchronous workers
- `nginx/` - proxy configuration
- `docker-compose.dev.yaml` - top-level development proxy setup
- `docker-compose.prod.yaml` - top-level production proxy setup
- `build_push.sh` - build and push helper
- `deploy.sh` - deployment helper
- `detect_changes.sh` - change detection helper

## Runtime flow

A typical request flow looks like this:

1. The browser connects to the frontend.
2. The frontend talks to backend services through Nginx and direct service endpoints when needed.
3. The backend persists long-lived data in PostgreSQL and transient room state in Redis.
4. Socket events keep room state, attendees, and activities synchronized in real time.
5. Notifications and workers handle delayed or asynchronous follow-up work.
6. Subscriptions service manages billing and plan access.

## Local development

Each service can be developed independently, but the usual pattern is:

1. Install dependencies inside the relevant service directory.
2. Configure environment variables for that service.
3. Start the service in watch mode or through its Docker setup.
4. Start Nginx once the backend and notifications networks are available.

### Common development commands

- Backend: see `backend/README.md`
- Frontend: see `frontend/README.md`
- Notifications: see `notifications/README.md`

### Docker notes

- The root `docker-compose.dev.yaml` and `docker-compose.prod.yaml` files are focused on the Nginx layer.
- They expect the backend and notifications Docker networks to already exist.
- Each service folder also contains its own Docker and compose configuration.

## Environment variables

Exact variables differ by service, but common values include:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - shared token secret for auth-enabled services
- `PORT` - service port override
- `REDIS_URL` - Redis connection string where applicable
- `SUPABASE_URL` and `SUPABASE_KEY` - Supabase integration values where used
- payment or provider keys for billing and notification flows

Refer to each service README and `.env` file for the full list.

## Testing and quality

- Backend services use Jest-based unit and e2e tests.
- Frontend uses Vitest.
- Linting and formatting are configured per service.

## Deployment

The repository includes helper scripts and separate Docker setups for development and production. Typical deployment responsibilities are split as follows:

- build images from each service directory
- publish service images to the registry
- deploy Nginx with the correct upstream network configuration
- make sure PostgreSQL, Redis, and any external providers are reachable in the target environment

## Notes

- This repository is designed as a modular monorepo, not a single bundled app.
- When updating shared behavior, check the backend, notifications, and frontend layers together.
- If you need service-specific setup, start with the README inside that service folder.
