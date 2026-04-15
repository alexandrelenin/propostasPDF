# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Client-side SPA (Single Page Application) with Firebase backend for persistence

**Key Characteristics:**
- React-based UI with TypeScript for type safety
- HashRouter for client-side routing (no server routes)
- Firebase Firestore as primary data store (templates, proposals, costs)
- PDF generation via jsPDF client-side, no server rendering
- Multi-view component architecture with centralized state in App root
- Separation of concerns: UI components, services (Firebase, PDF, formatters), types, constants

## Layers

**Presentation Layer:**
- Purpose: Render user interface and handle user interactions
- Location: `src/components/`
- Contains: React functional components with local state management
- Depends on: Types, services, constants, utilities
- Used by: App.tsx (root router), index.tsx (entry point)

**Service Layer:**
- Purpose: Handle external integrations and business logic
- Location: `src/services/`
- Contains: Firebase database operations, PDF generation, cost management
- Depends on: Types, Firebase SDK, jsPDF, utilities
- Used by: Components, App.tsx

**Type & Configuration Layer:**
- Purpose: Define domain models and application constants
- Location: `src/types.ts`, `src/constants.ts`
- Contains: TypeScript interfaces, default values, proposal item definitions
- Depends on: Nothing
- Used by: All other layers

**Utility Layer:**
- Purpose: Provide reusable formatting and helper functions
- Location: `src/utils/formatters.ts`
- Contains: Currency formatting, date formatting, ISO date generation
- Depends on: Nothing
- Used by: Services, components

**API Layer (Serverless):**
- Purpose: Server-side audio transcription via Vercel
- Location: `api/transcribe-audio.ts`
- Contains: AssemblyAI integration for audio-to-text conversion
- Depends on: External AssemblyAI service
- Used by: AudioUpload component

## Data Flow

**Creating a Proposal:**

1. User enters proposal data in ProposalView form
2. Form calculates item quantities, prices, support costs
3. User clicks "Save" → handleSaveProposal invoked
4. proposalService.saveProposal stores to Firebase
5. App.tsx refetches all proposals via getAllProposals
6. SavedProposalsMeta state updated in App.tsx
7. System message shows success

**Viewing/Editing a Proposal:**

1. User clicks proposal in SavedProposalsView
2. onViewProposal handler calls getProposalById from Firebase
3. Full Proposal object loaded into editingProposal state
4. ProposalView receives existingProposal and pre-fills form
5. ProposalView shows preview and preview/form tabs

**Generating PDF:**

1. User clicks "Gerar PDF" in ProposalView
2. currentProposal object passed to generateProposalPdf
3. jsPDF creates document with logo, header, tables
4. Items table renders main proposal items with pricing
5. Support services table rendered (if applicable)
6. Footer added to all pages with contact info
7. doc.save() triggers browser download

**Managing Templates:**

1. TemplatesView displays all templates from Firebase
2. User can edit default template settings
3. saveTemplate persists to Firebase with id='default'
4. setDefaultTemplate updates isDefault flag across all templates
5. getDefaultTemplate loads at App mount for initial state
6. App passes templateSettings to ProposalView for form defaults

**State Management:**

- **App.tsx (root):** Manages global state
  - templateSettings: Current active template
  - allTemplates: All available templates from Firebase
  - savedProposalsMeta: List metadata of all proposals
  - editingProposal: Current proposal being edited
  - systemMessage: Success/error notifications
  
- **Component-level:** Each component manages its own local state
  - ProposalView: form data, active tab, current proposal preview
  - CostsCrudView: costs list, form state
  - TemplateEditorView: form data for template editing

## Key Abstractions

**Proposal:**
- Purpose: Represents a complete commercial proposal with items and support services
- Examples: `src/types.ts` (Proposal interface), `src/services/proposalService.ts`
- Pattern: Value object with calculated fields (firstYearInvestment, supportMonthlyTotal)

**ProposalItem:**
- Purpose: Represents a line item in a proposal (equipment, services, licenses)
- Examples: `src/types.ts`, `src/constants.ts` (PROPOSAL_ITEM_DEFINITIONS)
- Pattern: Configuration-driven, categories determine pricing and description

**Template:**
- Purpose: Reusable settings for proposals (company info, logo, pricing)
- Examples: `src/types.ts`, `src/services/templateService.ts`
- Pattern: Settings object with default values, can be duplicated and marked as default

**Cost:**
- Purpose: Pricing information for proposal items with validity period
- Examples: `src/types.ts`, `src/services/costService.ts`
- Pattern: Time-series data with start date (vigenciaInicio) for versioning

## Entry Points

**Web Application:**
- Location: `src/index.tsx`
- Triggers: Page load
- Responsibilities: Mounts React app to DOM, wraps with HashRouter

**App Root Component:**
- Location: `src/App.tsx`
- Triggers: Application initialization
- Responsibilities: 
  - Fetches all proposals and templates on mount
  - Manages global state (templates, proposals, messages)
  - Renders navigation, routes, and footer
  - Handles template switching, proposal CRUD operations

**Route: / (Proposal Creation/Editing):**
- Component: `src/components/ProposalView.tsx`
- Responsibilities: Form for creating/editing proposals, preview, PDF generation

**Route: /templates:**
- Component: `src/components/TemplatesView.tsx`
- Responsibilities: List templates, navigate to editor, duplicate templates

**Route: /costs:**
- Component: `src/components/CostsCrudView.tsx`
- Responsibilities: CRUD operations for cost management

**Route: /audio-upload:**
- Component: `src/components/AudioUpload.tsx`
- Responsibilities: Audio transcription to proposal data extraction

## Error Handling

**Strategy:** Try-catch with user feedback via system messages

**Patterns:**

- Firebase operations wrapped in try-catch:
  - saveProposal, getAllProposals, getProposalById in `src/services/proposalService.ts`
  - saveTemplate, getDefaultTemplate in `src/services/templateService.ts`
  
- PDF generation errors caught and alerted:
  - generateProposalPdf wraps image loading, document creation in try-catch
  - Fallback text rendered if logo fails to load
  
- API errors handled in components:
  - Audio transcription errors shown in AudioUpload component
  - System message (error type) displays in App-level banner
  
- Frontend validation:
  - Form fields validate before calculation
  - localStorage checks for audio data with try-catch parsing

## Cross-Cutting Concerns

**Logging:** 
- console.error used for debugging (Firebase errors, PDF generation failures)
- No centralized logger; errors logged at service level

**Validation:**
- Proposal items must have quantity > 0 to be included in PDF
- Support services require supportNumSchools > 0
- Template requires isDefault boolean flag
- Form fields checked for undefined/null before calculations

**Authentication:**
- None implemented; Firebase Firestore rules should restrict access
- No user login; relies on client-side access to public/restricted Firestore database

**State Persistence:**
- localStorage used for temporary audio extraction data ('proposta_audio')
- Firebase Firestore used for permanent storage (templates, proposals, costs)
- No session management; fresh fetch on App mount

---

*Architecture analysis: 2026-04-15*
