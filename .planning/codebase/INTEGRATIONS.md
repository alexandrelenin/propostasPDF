# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**Audio Transcription:**
- AssemblyAI - Speech-to-text transcription for Portuguese audio
  - SDK/Client: Native fetch API
  - Auth: API key `ASSEMBLYAI_API_KEY` hardcoded in `/api/transcribe-audio.ts` (security concern)
  - Endpoint: `https://api.assemblyai.com/v2/`
  - Operations: Audio upload, transcription request, polling for completion

**AI Services:**
- Google Gemini API - Prepared for integration (key placeholder in env)
  - SDK/Client: Not yet integrated in codebase
  - Auth: Environment variable `GEMINI_API_KEY` defined in `.env.local`
  - Status: Configuration exists but no active usage detected

## Data Storage

**Databases:**
- Firebase Firestore - NoSQL database for proposals, templates, and costs
  - Connection: Configured in `src/services/firebase.ts`
  - Client: Firebase SDK v11.9.1
  - Project: `propostas-pdf-web`
  - Region: Managed by Firebase
  - Collections:
    - Proposals - Stores generated and saved proposals
    - Templates - Stores customized proposal templates
    - Costs - Stores cost configurations and pricing data

**File Storage:**
- Cloudinary - Image hosting for company logos
  - Cloud Name: `dfezexws1`
  - Upload Preset: `propostasPDF` (unsigned uploads)
  - Usage: `/src/components/TemplateEditorView.tsx` - Logo upload and storage
  - Endpoint: `https://api.cloudinary.com/v1_1/{cloudName}/image/upload`
  - Auth: Upload preset (no API key required for unsigned uploads)

**Local Storage:**
- Browser localStorage - Fallback for offline proposal data
  - Keys: `pdfProposalGenerator_templateSettings_v2`, `pdfProposalGenerator_savedProposals_v2`
  - Usage: `/src/services/storageManager.ts`

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication - Not actively used in current codebase
  - Configuration present in Firebase config but no auth imports detected
  - Firestore security rules likely manage access control

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging only (no production logging service)

## CI/CD & Deployment

**Hosting:**
- Vercel - Cloud platform for deployment
  - Configuration: `vercel.json` specifies Vite as framework
  - Build Command: `npm run build`
  - Output Directory: `dist/`
  - Install Command: `npm install`

**CI Pipeline:**
- None explicitly configured (Vercel provides default CI/CD)

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Google Gemini API key (placeholder value in `.env.local`)

**Active integrations requiring env config:**
- Firebase configuration is hardcoded in `src/services/firebase.ts` (includes public API key)
- AssemblyAI API key is hardcoded in `/api/transcribe-audio.ts`
- Cloudinary configuration is hardcoded in `src/components/TemplateEditorView.tsx`

**Secrets location:**
- `.env.local` file exists but contains only placeholder values
- Sensitive credentials (API keys) are hardcoded in source files (security concern)

## Webhooks & Callbacks

**Incoming:**
- `/api/transcribe-audio` - Vercel serverless function handles audio transcription requests

**Outgoing:**
- AssemblyAI polling - Client-side polling of transcription status
- Cloudinary upload response - Image metadata returned to frontend

---

*Integration audit: 2026-04-15*
