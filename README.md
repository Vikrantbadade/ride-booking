# RideX

RideX is a cross-platform Expo SDK 57 / React Native app with an Express + TypeScript REST API, PostgreSQL, Prisma 6, JWT sessions, Zod validation, and Zustand client state. Backend dependencies live in `backend/` and are independent of the Expo package.

## Repository structure

- `app/` — Expo Router passenger, driver, admin, and authentication screens.
- `src/components/ui/` — shared React Native UI components.
- `src/constants/` — API base URL and remaining demo location/ride-category constants.
- `src/services/` — typed API services, auth/session token storage, ride operations, and admin/driver requests.
- `src/store/` — Zustand state for authenticated users, current rides/history, and administrator driver verification.
- `backend/prisma/` — PostgreSQL schema, initial migration, and explicit development driver seed.
- `backend/src/` — Express setup, security middleware, validation, and auth/driver/ride/admin routes and services.
- `backend/tests/` — domain tests and an opt-in PostgreSQL API integration test.

## Prerequisites and environment

- Node.js 22 or newer and npm.
- Docker Engine and Docker Compose for the local PostgreSQL container.
- A LAN-reachable development machine for testing on a physical phone.

Create `backend/.env` from `backend/.env.example`. Set a private random `JWT_SECRET` of at least 32 characters and a `SEED_DEMO_PASSWORD` of at least 10 characters. `.env` files are ignored by Git. The values in Compose are local-development defaults only; never use them in production.

The backend default database is `127.0.0.1:5433`. Compose is intentionally run with a separate project name so it does not replace another project’s similarly named PostgreSQL service or volume.

## Start PostgreSQL and the backend

From the repository root:

```sh
cd backend
npm install
docker compose -p ridex-local up -d db
```

Apply the checked-in migration to a new database, then optionally seed verified development drivers:

```sh
npm run prisma:deploy
npm run db:seed
```

The seed is development-only, requires `NODE_ENV=development` and `SEED_DEMO_PASSWORD`, and is idempotent. It creates two verified, online drivers with vehicle records; it does not create an admin or a passenger. Passenger accounts use the registration screen or `POST /api/auth/register`.

Start the backend from `backend/` with `npm run dev`. It listens on port 3001 by default. `GET /` reports the API name; `GET /api/health` checks PostgreSQL readiness. In this workspace, an unrelated service already owns host port 3000, so RideX is configured to use 3001. To run the optional containerized API instead of `npm run dev`, stop the local Node server first, then run `docker compose -p ridex-local up -d --build`; the API container waits for the database and applies migrations before startup.

To provision an administrator, run the one-off `npm run admin:create` from `backend/` with `RIDEX_CONFIRM_ADMIN_BOOTSTRAP=true`, `ADMIN_EMAIL`, `ADMIN_NAME`, and an `ADMIN_PASSWORD` of at least 14 characters supplied through the environment. There is no public administrator registration route or hardcoded admin account.

## Database and migration workflow

- `npm run prisma:validate` — validate the Prisma schema.
- `npm run prisma:deploy` — apply committed migrations without resetting data.
- `npm run prisma:migrate -- --name <name>` — create and apply a development migration.
- `npm run prisma:generate` — regenerate Prisma Client.
- Do not run `prisma migrate reset` against data you need to keep.

The initial migration creates users, passenger and driver profiles, vehicles, rides, auth sessions, payments, invoices, and administrator audit events. It also creates coordinate/fare constraints and a PostgreSQL partial unique index that prevents a driver from having more than one active assigned ride.

## REST API

All protected routes require `Authorization: Bearer <accessToken>`. Registration only accepts passenger or driver roles. Admin accounts are provisioned out of band.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Register passenger or driver; driver registration requires vehicle data. Passwords are bcrypt-hashed. |
| `POST /api/auth/login` | Public, rate-limited | Create a JWT access token and persisted session. |
| `POST /api/auth/logout` | Authenticated | Revoke the current session. |
| `GET /api/auth/me` | Authenticated | Return current user and driver verification state. |
| `POST /api/rides/estimate` | Public | Server fare and clearly labelled adjusted straight-line distance estimate. |
| `POST /api/rides` | Passenger | Create a ride; match an eligible online, verified driver with a vehicle. |
| `GET /api/rides` | Authenticated | List only the current passenger’s rides, current driver’s assigned rides, or all rides for admin. |
| `GET /api/rides/:id` | Ride participant or admin | Read an authorized ride; driver coordinates are returned only for active rides. |
| `POST /api/rides/:id/match` | Passenger owner | Retry matching a still-requested ride. |
| `POST /api/rides/:id/cancel` | Passenger owner | Cancel a request before the ride starts. |
| `POST /api/rides/:id/decline` | Assigned driver | Decline a newly assigned ride and return it to matching. |
| `PATCH /api/rides/:id/status` | Assigned driver | Advance `ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED`; completion persists final fare and invoice. |
| `GET /api/rides/:id/invoice` | Passenger owner | Retrieve a completed ride’s stored invoice. |
| `POST /api/rides/:id/payments/development` | Passenger owner, development only | Idempotent local payment simulation. Returns 501 outside development. |
| `GET /api/drivers/me` | Driver | Return own driver profile and vehicle. |
| `PUT /api/drivers/me/availability` | Driver | Set online/offline; going online requires admin verification and a vehicle. |
| `PUT /api/drivers/me/location` | Driver | Store validated driver coordinates; active-ride updates must include that ride’s ID. |
| `PUT /api/drivers/me/vehicle` | Driver | Add/update vehicle data; changes return the driver to pending verification. |
| `GET /api/admin/drivers` | Admin | List driver profiles, vehicles, online/verification state, and ride totals. |
| `PATCH /api/admin/drivers/:id/verification` | Admin | Approve/reject a driver and write an audit record. |

Passenger ride listing, individual ride access, cancellation, payment, and invoice access are scoped to the authenticated passenger. Driver ride actions are scoped to assigned rides. Admin endpoints require the `ADMIN` role.

## Connect the Expo app

The app reads `EXPO_PUBLIC_API_URL`. Root `.env` is ignored by Git. Defaults are `http://10.0.2.2:3000` on Android emulator and `http://localhost:3000` elsewhere. For this workspace’s backend on port 3001, the ignored local root `.env` uses `http://localhost:3001` for web/iOS Simulator. Change it as appropriate:

- Android emulator: `http://10.0.2.2:3001`.
- Physical device: `http://<your-computer-LAN-IP>:3001`; allow the port through the local firewall and keep the phone and computer on a reachable network.
- Production: use an HTTPS API URL.

Restart Expo after changing the URL: `npx expo start --clear`. Access tokens use Expo SecureStore on iOS/Android and AsyncStorage on web. Do not put database URLs, JWT secrets, or payment secrets in `EXPO_PUBLIC_*` variables.

## Authentication, roles, and security

Passwords are bcrypt-hashed, access tokens are signed JWTs backed by revocable database sessions, and request bodies/coordinates are Zod-validated. Helmet, an allowlist-based CORS policy, JSON size limits, and authentication rate limiting are enabled. Ride transitions, fare calculation, driver verification, and payment status are server-controlled. Do not deploy the local Compose password or development payment simulation.

## Testing and checks

From `backend/`:

```sh
npm run build
npm run lint
npm test
npm run prisma:validate
npm run prisma:deploy
```

The default backend tests include domain/security checks; the PostgreSQL integration test is skipped unless explicitly enabled. With the local development database and demo driver seed available, run `NODE_ENV=development RIDEX_INTEGRATION_TESTS=true npm test`. It creates uniquely named test accounts/rides and removes only those test rows when finished.

From the repository root:

```sh
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Current implementation status and limitations

**Connected and exercised locally:** auth registration/login/logout and session restore; passenger server fare estimates, booking, nearest eligible driver assignment, retry/decline, cancellation, persistent history, status progression, invoice generation, and development-only idempotent payment; admin driver list and approve/reject audit events; driver availability and vehicle checks; foreground location updates and passenger polling; PostgreSQL migration and API health.

**Explicitly partial or simulated:** distance uses a straight-line calculation multiplied by a configurable road-factor estimate, not road routing. The map art is a UI placeholder. Location runs only while the driver ride screen is foregrounded; it is polled by passengers, not a WebSocket/background service. Payments are a local development simulator, not real cash/card/UPI processing. Invoice records are persisted, but PDF generation and sharing are placeholders. Document evidence upload/storage and per-document review are not connected. Driver earnings/rating summaries, saved places, some profile counters, safety/support actions, and admin system-wide summary totals still use demo or placeholder data. Push notifications are not implemented.

**Production work remaining:** configure TLS and production CORS; manage JWT secrets and backups; deploy PostgreSQL/API with monitoring; choose a routing provider and pricing policy; integrate object storage and review workflows for driver documents; implement a payment provider with signed webhooks and reconciliation; decide foreground/background tracking policy and platform permissions; complete privacy/security review and replace remaining mock UI data.

No SRS document was found in the repository, so precise SRS acceptance criteria remain unverified. The labels in existing screens are not a substitute for the uploaded requirements document.
