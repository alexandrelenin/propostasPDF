# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- React components: PascalCase with .tsx extension (e.g., `ProposalView.tsx`, `TemplateEditorView.tsx`)
- Services: camelCase with .ts extension (e.g., `templateService.ts`, `pdfGenerator.ts`, `proposalService.ts`)
- Utility files: camelCase describing function group (e.g., `formatters.ts`)
- Type definitions: `types.ts` for domain types
- Configuration: `constants.ts` for constants and initial values

**Functions:**
- Async functions use camelCase starting with verbs (e.g., `fetchCosts()`, `calculateProposal()`, `generateProposalPdf()`)
- Handler functions follow pattern `handle[Action]` (e.g., `handleSaveProposal`, `handleDeleteProposal`, `handleFieldChange()`)
- Utility functions are descriptive and prefixed where context helps (e.g., `formatCurrency()`, `formatDateForDisplay()`, `getCurrentDateISO()`)
- Firebase service functions are action verbs (e.g., `saveTemplate()`, `getAllTemplates()`, `getTemplateById()`, `deleteTemplate()`)

**Variables:**
- State variables use camelCase (e.g., `templateSettings`, `formData`, `currentProposal`)
- Boolean state variables prefix with "is" or explicit intent (e.g., `isEditing`, `includeSupportServices`, `logoAddedSuccessfully`)
- Constants use UPPER_SNAKE_CASE for configuration values (e.g., `INITIAL_TEMPLATE_SETTINGS`, `PROPOSAL_ITEM_DEFINITIONS`)
- Collection references follow pattern `[resource]Collection` (e.g., `templatesCollection`)

**Types:**
- Interfaces use PascalCase and describe what they represent (e.g., `Proposal`, `Template`, `ProposalItem`, `TemplateSettings`)
- Enums use PascalCase with UPPER_SNAKE_CASE members (e.g., `ProposalItemCategory.ELECTRONIC_DEVICE`)
- Props interfaces suffix with "Props" (e.g., `ProposalViewProps`, `NavbarProps`)

## Code Style

**Formatting:**
- No explicit linter or prettier config detected
- Indentation: 2 spaces (observed in all files)
- Line length: generally 80-100 characters
- Semicolons: present on statements (not optional chaining)
- Quotes: single quotes in JSX, strings use single quotes

**Linting:**
- No ESLint or TypeScript config strict mode is enabled
- TypeScript strict mode enabled in `tsconfig.json`:
  - `"strict": true`
  - `"noUnusedLocals": true`
  - `"noUnusedParameters": true`
  - `"noFallthroughCasesInSwitch": true`
  - `"noUncheckedSideEffectImports": true`

## Import Organization

**Order:**
1. React and external library imports (React, react-router-dom, third-party packages)
2. Type imports and type definitions from `./types`
3. Constants from `./constants`
4. Service imports from `./services`
5. Component imports from `./components`
6. Utility imports from `./utils`
7. CSS/style imports

**Examples from codebase:**
```typescript
// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ProposalView from './components/ProposalView';
import { Template, Proposal, SavedProposalMeta } from './types';
import { INITIAL_TEMPLATE_SETTINGS } from './constants';
import { saveTemplate, getTemplateById } from './services/templateService';
```

**Path Aliases:**
- `@/*` resolves to project root (e.g., `@/types`, `@/services`)
- Configured in `tsconfig.json`: `"paths": { "@/*": ["./*"] }`
- Not actively used in codebase (relative imports preferred)

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations that may fail (e.g., image fetch in `pdfGenerator.ts`)
- Fallback values provided when operations fail:
  - Empty strings for failed URL conversions: `logoDataUrl = ""`
  - Original values if parsing fails: `return dateString`
  - null return type for optional queries: `return null`
- Errors logged to console for debugging: `console.error('Error message', error)`
- User-facing errors shown via alert dialogs: `alert("Erro: ...")`
- Async functions that could throw use try-catch (e.g., `generateProposalPdf()`, service functions)

**Example from `pdfGenerator.ts`:**
```typescript
try {
  const response = await fetch(settings.companyLogoUrl);
  const blob = await response.blob();
  // ... conversion logic
} catch (e) {
  console.error('Erro ao baixar/converter logo:', e);
  logoDataUrl = "";
}
```

## Logging

**Framework:** console methods (no external logging library)

**Patterns:**
- `console.error()` for error conditions (e.g., `console.error('Erro ao salvar PDF:', error)`)
- `console.warn()` for warning conditions (e.g., `console.warn("Could not determine image format...")`)
- Console logging used in catch blocks and error paths
- No debug logging level used

**Example usage in `pdfGenerator.ts`:**
```typescript
console.error('Erro ao baixar/converter logo do Cloudinary:', e);
console.warn("Could not determine image format from data URL for logo:", logoDataUrl.substring(0, 70));
```

## Comments

**When to Comment:**
- Complex logic with multiple steps (e.g., image format detection in `pdfGenerator.ts`)
- Non-obvious calculations or transformations
- Business logic explanations (e.g., support service description template)
- Disabled code with explanation (e.g., commented-out summary calculation in `pdfGenerator.ts`)

**Style:**
- Single-line comments: `// Comment`
- Multi-line blocks: `/* ... */` (rare, prefer multiple single-line)
- Comments explain WHY not WHAT

**JSDoc/TSDoc:**
- Not used consistently in codebase
- No JSDoc annotations found
- Type information sufficient from TypeScript types and interfaces

## Function Design

**Size:** Functions average 20-40 lines for business logic, 5-15 for small utilities
- `generateProposalPdf()` is longest at 360 lines (complex PDF generation)
- Most service functions are 5-10 lines (single database operation)
- Component render functions extract sub-components to keep size manageable

**Parameters:**
- Props passed as single object parameter for components (destructured)
- Service functions take specific typed parameters
- Callback functions use consistent naming: `on[Action]` pattern

**Example from `ProposalView.tsx`:**
```typescript
const ProposalView: React.FC<ProposalViewProps> = ({ 
  templateSettings, 
  allTemplates, 
  onTemplateChange, 
  onSaveProposal, 
  // ... destructured props
}) => {
```

**Return Values:**
- Services return Promises with typed results or null
- Components return JSX.Element or React.ReactNode
- Utility functions return primitive types (string, number, boolean)
- Void returns for mutation-only handlers

## Module Design

**Exports:**
- Default exports for React components (e.g., `export default AppWrapper`)
- Named exports for utility functions (e.g., `export const formatCurrency = ...`)
- Named exports for service functions (e.g., `export async function saveTemplate()`)
- Type definitions exported as named exports

**Barrel Files:**
- Not used
- Each component/service imported directly
- `types.ts` serves as single source of type definitions

**Directory organization by concern:**
- `components/`: React UI components
- `services/`: Business logic and external API integration
- `utils/`: Pure utility functions
- `types.ts`: All type definitions
- `constants.ts`: Configuration and constants
- `App.tsx`: Main router and layout
- `index.tsx`: Entry point

---

*Convention analysis: 2026-04-15*
