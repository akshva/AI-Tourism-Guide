# Copilot Instructions for Travel Itinerary Generator

## Project Overview
This is a **Next.js travel planning SPA** that generates AI-powered itineraries using Google Gemini API. Users authenticate via NextAuth.js (credentials-based), create/save itineraries to MongoDB, and can collaborate with others or export as PDFs.

## Architecture & Key Patterns

### Tech Stack
- **Framework**: Next.js 14 (TypeScript, SSR/SSG)
- **UI**: React 18, Tailwind CSS 3, Framer Motion (animations)
- **Auth**: NextAuth.js 4 (JWT strategy, credentials-based)
- **Database**: MongoDB + Mongoose (single global cached connection)
- **AI**: Google Generative AI (Gemini with fallback model handling)
- **Export**: jsPDF + html2canvas

### Data Flow
1. **Auth**: `pages/api/auth/[...nextauth].ts` → JWT callbacks sync user ID to session
2. **Itinerary Generation**: `pages/create.tsx` → POST `/api/itineraries/generate` → Gemini prompt → saves `Itinerary` model → redirects to `/itineraries/[id]`
3. **DB Connection**: Global cached mongoose connection in `lib/mongodb.ts` to prevent connection pooling issues in serverless

### Model Structure
- **User**: name, email (unique), hashed password with bcryptjs, timestamps
- **Itinerary**: nested `IDay[]` (activities, costs), `collaborators[]` ObjectId array, `isPublic` flag
- **Key interfaces**: `IActivity`, `IDay`, `IItinerary` in `models/Itinerary.ts`

## Critical Developer Workflows

### Development
```bash
npm run dev          # Start Next.js dev server on :3000
npm run build       # Production build
npm run lint        # ESLint on files
```

### Environment Setup
Create `.env.local` with:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
GEMINI_API_KEY=your_google_api_key
NEXTAUTH_SECRET=random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

### Common API Patterns
- All API routes use `getServerSession(req, res, authOptions)` for auth validation
- Error responses include helpful context (e.g., MongoDB whitelist instructions in `generate.ts`)
- Use `mongoose.Types.ObjectId` when pushing to collaborators array to maintain type safety

## Project-Specific Conventions

### Styling
- **Tailwind only** (no CSS modules) — extend config in `tailwind.config.js`
- **Color scheme**: Blue-to-purple gradients (see `Layout.tsx` nav)
- **Icons**: react-icons (`FiHome`, `FiUser`, etc.)

### Component Patterns
- Page components wrap children in `<Layout>` (handles nav, session state)
- Protected pages use `<ProtectedRoute>` wrapper from `components/ProtectedRoute.tsx`
- State management: React hooks + toast notifications via `react-hot-toast`

### NextAuth Configuration
- **JWT strategy** with token callbacks (`jwt`, `session` in authOptions)
- **Custom pages**: `/auth/signin` only (signup handled via `/api/auth/signup` endpoint)
- Session token includes user `id` for authorization checks
- Do NOT include `signUp` in `pages` config — use standard NextAuth credentials flow

### TypeScript Strict Mode
- Type `mongoose.Types.ObjectId` arrays carefully — use `some()` for comparisons, not `includes()`
- Convert string IDs using `new mongoose.Types.ObjectId(stringId)` when pushing to ObjectId arrays
- Use `as any` casting for discriminated union types where necessary (e.g., populated vs unpopulated fields)

### Gemini Model Selection
`lib/gemini.ts` tries models in fallback order (gemini-2.5-flash → gemini-2.5-pro → etc.). Always catch errors per model attempt and provide helpful debugging context.

### PDF Export
`lib/pdfGenerator.ts` uses jsPDF with page breaks for long itineraries. Handles hex-to-RGB color conversion for styling.

## Integration Points & Cross-Component Communication

| Component | Dependencies | Output/Effect |
|-----------|---|---|
| `create.tsx` | → `/api/itineraries/generate` (Gemini + save) → redirect `/itineraries/[id]` | Itinerary document created |
| `dashboard.tsx` | → `/api/itineraries/index` (fetch user's) | Renders owned + collaborated itineraries |
| `CurrencyConverter` | → `/api/currency/convert` | Real-time exchange rates in INR |
| `Layout.tsx` | ← `useSession()` (NextAuth) | Conditional nav rendering based on auth |
| `collaborate.ts` | POST: add collaborator | Uses ObjectId arrays with `some()` checks |
| PDF Download | `pdfGenerator.ts` + itinerary data | Browser download as PDF |

## File Reference Guide
- **Pages** (`pages/`): Entry points for routes
- **API Routes** (`pages/api/`): Backend handlers (NextAuth, itineraries, currency, user profile, collaboration)
- **Models** (`models/`): Mongoose schemas with TypeScript interfaces
- **Components** (`components/`): Reusable React UI (Layout, ProtectedRoute, modals)
- **Lib** (`lib/`): Services (Gemini AI, MongoDB connection, PDF generation, currency utils)

## Common Pitfalls to Avoid
1. **MongoDB**: Don't create multiple connections — `dbConnect()` uses global cache
2. **Auth**: Always check `session?.user` before using user data in API handlers
3. **Models**: Use `lean()` queries when mutation isn't needed (faster)
4. **Gemini**: API key errors are environment issues, not code bugs — check `.env.local`
5. **File paths**: Use `@/*` path alias (maps to workspace root) for clean imports
6. **ObjectId arrays**: Use `some((id) => id.toString() === otherId.toString())` for comparisons
7. **NextAuth pages**: Only use `signIn` in pages config; signup is a custom endpoint

## Performance & Security Notes
- JWT tokens stored in httpOnly cookies by NextAuth (XSS-safe)
- Passwords hashed with bcryptjs before DB save (`User.ts` pre-save hook)
- Collaborators feature uses MongoDB ObjectId array for filtering public itineraries
- Consider rate-limiting on `/api/itineraries/generate` (Gemini calls are slow)
- Never expose MongoDB credentials in client-side code — stored in `.env.local` only
