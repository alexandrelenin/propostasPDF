# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
propostasPDF/
├── .git/                   # Git repository
├── .planning/              # GSD planning directory
│   └── codebase/          # Codebase analysis documents
├── api/                    # Serverless API routes (Vercel)
│   └── transcribe-audio.ts # Audio transcription endpoint
├── doc/                    # Documentation and proposals
│   ├── PROPOSTA_COMERCIAL_CLIENTE.md
│   └── Proposta Comercial - Smart Tech.pdf
├── src/                    # Application source code
│   ├── components/         # React UI components
│   ├── services/           # Business logic and integrations
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Root component with routing
│   ├── index.tsx           # React DOM entry point
│   ├── index.css           # Global styles
│   ├── types.ts            # TypeScript type definitions
│   ├── constants.ts        # Application constants
│   └── global.d.ts         # Global type declarations
├── templates/              # Template models/reference
│   └── modelo-para IA.htm  # HTML reference for AI
├── index.html              # HTML entry point
├── package.json            # NPM dependencies
├── package-lock.json       # Locked dependency versions
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.cjs     # Tailwind CSS configuration
├── postcss.config.cjs      # PostCSS configuration
├── vercel.json             # Vercel deployment config
├── metadata.json           # Application metadata
└── .gitignore              # Git ignore rules
```

## Directory Purposes

**api/**
- Purpose: Serverless functions deployed to Vercel
- Contains: TypeScript server-side code
- Key files: `transcribe-audio.ts` (AssemblyAI integration for audio transcription)

**src/**
- Purpose: Main application source code
- Contains: React components, services, types, utilities
- Key files: All business logic and UI implementation

**src/components/**
- Purpose: React functional components for UI views
- Contains: View components, each handling a specific page/feature
- Key files:
  - `ProposalView.tsx`: Main form for creating/editing proposals (702 lines)
  - `TemplatesView.tsx`: Template management and selection (169 lines)
  - `SavedProposalsView.tsx`: List and manage saved proposals (115 lines)
  - `CostsCrudView.tsx`: Cost data management interface (275 lines)
  - `TemplateEditorView.tsx`: Form for editing template settings (279 lines)
  - `AudioUpload.tsx`: Audio transcription and data extraction (197 lines)

**src/services/**
- Purpose: Business logic, data persistence, and external integrations
- Contains: Firebase Firestore operations, PDF generation, cost management
- Key files:
  - `firebase.ts`: Firebase SDK initialization and Firestore database reference
  - `proposalService.ts`: CRUD operations for proposals
  - `templateService.ts`: CRUD operations for templates, default management, duplication
  - `costService.ts`: CRUD operations for cost records
  - `pdfGenerator.ts`: jsPDF document generation with complex formatting (361 lines)
  - `storageManager.ts`: Client-side storage management

**src/utils/**
- Purpose: Reusable helper functions and utilities
- Contains: Formatting, date handling, calculations
- Key files: `formatters.ts` (currency, date formatting, ISO date generation)

**doc/**
- Purpose: Project documentation and example proposals
- Contains: Reference documents and generated PDFs
- Key files: Proposal examples and commercial documentation

**templates/**
- Purpose: Reference templates for AI/model training
- Contains: HTML templates
- Key files: `modelo-para IA.htm` (HTML reference for proposal structure)

## Key File Locations

**Entry Points:**
- `index.html`: Web page entry point with root div and script loader
- `src/index.tsx`: React DOM root rendering
- `src/App.tsx`: Root React component with HashRouter and global state management

**Configuration:**
- `tsconfig.json`: TypeScript compiler options (strict mode enabled)
- `vite.config.ts`: Vite build tool configuration with env vars
- `tailwind.config.cjs`: Tailwind CSS theme configuration
- `postcss.config.cjs`: PostCSS/Autoprefixer configuration
- `vercel.json`: Vercel deployment settings
- `package.json`: NPM dependencies and build scripts

**Core Logic:**
- `src/types.ts`: All TypeScript interfaces (Proposal, Template, Cost, etc.)
- `src/constants.ts`: Default values, proposal item definitions, support service template
- `src/App.tsx`: Global state management and route definitions

**Business Services:**
- `src/services/firebase.ts`: Database connection
- `src/services/proposalService.ts`: Proposal persistence
- `src/services/templateService.ts`: Template persistence and management
- `src/services/costService.ts`: Cost data operations
- `src/services/pdfGenerator.ts`: PDF document generation

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `ProposalView.tsx`, `AudioUpload.tsx`)
- Services: camelCase with Service suffix (e.g., `proposalService.ts`, `templateService.ts`)
- Utilities: camelCase (e.g., `formatters.ts`)
- Types/Constants: camelCase (e.g., `types.ts`, `constants.ts`)

**Directories:**
- Feature directories: lowercase (e.g., `components/`, `services/`, `utils/`)
- Logical grouping by function, not by layer

**Functions:**
- camelCase for all functions
- Handler functions prefixed with `handle` (e.g., `handleSaveProposal`, `handleDeleteProposal`)
- Service functions are action verbs (e.g., `saveProposal`, `getAllProposals`, `getProposalById`)
- Getter functions start with `get` (e.g., `getTemplateById`, `getDefaultTemplate`)
- Async operations use async/await pattern

**Variables:**
- camelCase for all variables and constants
- State variables declared with `const` and useState hook
- Template IDs use uuidv4 format
- Enum values in UPPER_SNAKE_CASE (e.g., `ELECTRONIC_DEVICE`, `SUPPORT_SERVICES`)

**Types:**
- Interfaces: PascalCase with no prefix (e.g., `Proposal`, `Template`, `ContactInfo`)
- Enums: PascalCase (e.g., `ProposalItemCategory`)
- Type unions: PascalCase (e.g., `ProposalInputData`)

## Where to Add New Code

**New Feature (e.g., new proposal section):**
- Primary code: `src/components/ProposalView.tsx` (add form fields and preview)
- Types: Add interface to `src/types.ts`
- Constants: Add defaults to `src/constants.ts`
- Service: Extend `src/services/proposalService.ts` if persistence needed
- Tests: Create `src/components/ProposalView.test.tsx` (if testing implemented)

**New Component/Module (e.g., new view/page):**
- Implementation: `src/components/{FeatureName}View.tsx`
- Types: Add to `src/types.ts` if new domain types needed
- Service (if data-dependent): `src/services/{featureName}Service.ts`
- Route: Add Route to App.tsx in Routes section

**Utilities/Helpers:**
- Shared formatting: `src/utils/formatters.ts`
- Shared calculations: Create `src/utils/{domain}.ts` (e.g., `calculators.ts`)
- Constants: `src/constants.ts` for app-wide defaults

**Firebase Integration:**
- All Firestore operations: `src/services/{entity}Service.ts` (one file per collection)
- Database initialization: `src/services/firebase.ts`

**Styling:**
- Tailwind classes: Inline in components (no separate CSS files except global)
- Global styles: `src/index.css` (print rules, scrollbar, A4 preview)
- Theme: `tailwind.config.cjs` (colors, fonts, custom utilities)

## Special Directories

**.env.local:**
- Purpose: Environment configuration (contains GEMINI_API_KEY)
- Generated: No
- Committed: No (listed in .gitignore)
- Note: Used by Vite via loadEnv for API key injection

**.git/**
- Purpose: Git repository metadata
- Generated: Yes (by git init)
- Committed: Version control system data

**.planning/**
- Purpose: GSD orchestrator planning documents
- Generated: Yes (by /gsd-map-codebase and /gsd-plan-phase)
- Committed: Yes (codebase analysis documents)

**node_modules/**
- Purpose: NPM installed packages
- Generated: Yes (by npm install)
- Committed: No (listed in .gitignore)

---

*Structure analysis: 2026-04-15*
