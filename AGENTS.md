# ExplicaMe - Agent Instructions

## Architecture

**Data Storage:**
- SQLite database using @libsql/client (local file mode)
- Database file: `data/app.db`
- Server Actions in `app/actions/` for all CRUD operations
- User identity (UUID) stored in browser localStorage (per-device)

**State Management:**
- Custom React hooks in `hooks/` directory
- Hooks call Server Actions for data persistence
- Client-side state syncs with SQLite via Server Actions

**AI Features (Mocked for v1):**
- Mock implementations in `mocks/` directory
- Prefixed with `mock-` for clarity
- Will be replaced with real AI in v2

**Project Structure:**
- `app/` - Next.js pages and components (production)
- `app/actions/` - Server Actions (database operations)
- `hooks/` - Custom React hooks (production)
- `lib/` - Utility functions (production)
- `lib/db.ts` - SQLite client and schema
- `types/` - TypeScript interfaces (production)
- `mocks/` - Mock AI implementations (temporary, prefixed with mock-)
- `__dev__/` - Test components and utilities (development only)

## Dev Code Separation

- All mock files prefixed with `mock-`
- All test/dev code in `__dev__/` directory
- Never import from `__dev__/` in production code

## Database

**Tables:**
- `convos` - Conversations
- `messages` - Messages in conversations
- `participations` - User-conversation relationships
- `breakdowns` - AI-generated breakdowns of messages/interpretations
- `points` - Individual points from breakdowns
- `interpretations` - User interpretations of messages
- `interpretation_gradings` - Author's evaluation of interpretations
- `interpretation_grading_responses` - Disputes from interpreters
- `arbitrations` - AI-mediated resolutions

**Initialization:**
- Database initialized automatically on app startup via `lib/db-init.ts`
- Called in `app/layout.tsx` server-side

## Development Notes

- User ID is stored in browser localStorage (per-device identity)
- All conversation/message data is in SQLite (shared across users)
- This enables multi-user conversations across different browsers/devices
