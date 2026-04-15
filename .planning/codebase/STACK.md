# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- TypeScript 5.7.2 - Application code, components, services, types
- JavaScript - Build configuration, configuration files

**Secondary:**
- HTML - Index entry point at `index.html`
- CSS - Tailwind CSS for styling

## Runtime

**Environment:**
- Node.js 18+ (required for development)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.1.0 - UI component framework
- React Router DOM 7.6.1 - Client-side routing

**PDF Generation:**
- jsPDF 2.5.1 - PDF document creation
- jsPDF-AutoTable 3.8.2 - Table generation in PDFs
- html2canvas 1.4.1 - HTML to canvas conversion for PDF embedding

**Build/Dev:**
- Vite 6.3.5 - Build tool and dev server
- TypeScript 5.7.2 - Type checking and compilation

**Styling:**
- Tailwind CSS 3.4.3 - Utility-first CSS framework
- PostCSS 8.4.38 - CSS transformations
- Autoprefixer 10.4.19 - CSS vendor prefixes

## Key Dependencies

**Critical:**
- firebase 11.9.1 - Backend database and authentication (Firestore)
- uuid 11.1.0 - UUID generation for proposal IDs
- react-router-dom 7.6.1 - Routing between views

**Infrastructure:**
- @types/react 19.1.8 - Type definitions for React
- @types/react-dom 19.1.6 - Type definitions for React DOM
- @types/node 22.14.0 - Type definitions for Node.js

## Configuration

**Environment:**
- `.env.local` file present - Contains `GEMINI_API_KEY` (placeholder)
- `vite.config.ts` - Vite build configuration with environment variable loading
- Environment variables injected at build time via Vite `define` option

**Build:**
- `tsconfig.json` - TypeScript compiler configuration with strict mode enabled
- `tailwind.config.cjs` - Tailwind CSS configuration
- `postcss.config.cjs` - PostCSS configuration
- `vite.config.ts` - Vite configuration with `@` path alias pointing to project root

## Platform Requirements

**Development:**
- Node.js 18 or higher
- npm or equivalent package manager
- Modern browser with ES2020+ support

**Production:**
- Vercel deployment platform (as specified in `vercel.json`)
- Supports static site hosting with serverless API functions

---

*Stack analysis: 2026-04-15*
