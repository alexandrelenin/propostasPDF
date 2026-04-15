# Codebase Concerns

**Analysis Date:** 2026-04-15

## Security Concerns

### Exposed Firebase API Key

**Risk:** Firebase API key is hardcoded in public source code
- **Files:** `src/services/firebase.ts` (line 6)
- **Current state:** `apiKey: "AIzaSyCuqDzr5tlvrjju9AnoI627YxU6yme-NDc"` is visible in repository
- **Impact:** Firebase project is potentially accessible to anyone with access to the codebase; allows unauthorized reads/writes if Firestore security rules are weak
- **Mitigation needed:** Firebase keys for web apps are public-safe by design when paired with strong security rules, but this should be moved to environment variables for consistency and safer deployment practices
- **Recommendations:** 
  1. Move Firebase config to `.env.local` and load via environment variables
  2. Verify Firestore security rules are properly configured to restrict unauthorized access
  3. Update build pipeline to exclude `.env` files from commits

### Cloudinary Credentials Exposed

**Risk:** Cloudinary cloud name and upload preset are hardcoded
- **Files:** `src/components/TemplateEditorView.tsx` (lines 6-7)
- **Current state:** `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are visible
- **Impact:** While upload presets are meant to be public, the combination with cloud name allows uploading files; abuse potential for storage exhaustion
- **Recommendations:** 
  1. Move to environment variables
  2. Consider implementing rate limiting on image uploads
  3. Add file type/size validation beyond client-side

### Weak Error Handling in Audio Upload

**Risk:** Generic error messages hide actual issues
- **Files:** `src/components/AudioUpload.tsx` (lines 112-113)
- **Current state:** `catch (err) { setError('Erro ao enviar áudio'); }` swallows all error details
- **Impact:** Difficult to debug issues; API failures not properly reported
- **Recommendations:** Log error details to console for debugging; distinguish network vs. transcription errors

## Tech Debt

### Empty Storage Manager File

**Issue:** Placeholder file with no implementation
- **Files:** `src/services/storageManager.ts`
- **Current state:** File exists but contains only empty lines
- **Impact:** Misleading – appears to be a service layer but is unused
- **Fix approach:** Either implement the storage manager interface or remove the file entirely

### Repetitive Firebase Query Logic

**Issue:** Similar patterns repeated across service files
- **Files:** 
  - `src/services/templateService.ts`
  - `src/services/proposalService.ts`
  - `src/services/costService.ts`
- **Current state:** All three files independently query Firestore with similar `getDocs()` patterns
- **Impact:** Difficult to maintain; any changes to query patterns must be repeated
- **Fix approach:** Extract a generic Firebase service layer with reusable query/update methods

### Type Casting Without Validation

**Issue:** Direct `as Template` and `as Proposal` casts without runtime validation
- **Files:** 
  - `src/services/templateService.ts` (lines 16, 22, 47)
  - `src/services/proposalService.ts` (lines 13, 19)
  - `src/services/costService.ts` (lines 13, 19)
- **Current state:** `doc.data() as Template` assumes data matches type
- **Impact:** Runtime errors if Firestore schema changes or contains invalid data
- **Fix approach:** Implement Zod or similar validation library to parse and validate data at runtime

### Bare `catch` Handlers with Empty Blocks

**Issue:** Silent error swallowing in audio parsing
- **Files:** `src/components/ProposalView.tsx` (lines 91)
- **Current state:** `try { JSON.parse(...) } catch {}` silently fails without logging
- **Impact:** Bugs in localStorage consumption go unnoticed
- **Recommendations:** Add explicit error handling or at least log to console

## Error Handling Gaps

### Missing Error Boundaries

**Issue:** No React error boundaries for component failures
- **Files:** All React components
- **Current state:** No ErrorBoundary components wrapping the application
- **Impact:** If any component throws an error, the entire app crashes
- **Recommendations:** Wrap `App.tsx` and major route sections with error boundary

### Unhandled Promise Rejections

**Issue:** Fire-and-forget async operations
- **Files:** 
  - `src/App.tsx` (lines 94, 127, 161, 174)
  - `src/components/ProposalView.tsx` (line 187)
- **Current state:** Multiple `useEffect` hooks with async functions that don't handle all error paths
- **Impact:** If Firebase calls fail, state can become inconsistent; no retry logic
- **Example:** `fetchProposalsAndTemplates()` in App.tsx has no error handling if `getAllProposals()` fails
- **Fix approach:** 
  1. Add `.catch()` handlers to all Firebase async calls
  2. Implement retry logic for critical operations
  3. Show error messages to users for failed data loads

### Missing Validation in Critical Functions

**Issue:** No validation before PDF generation
- **Files:** `src/components/ProposalView.tsx` (lines 233-252)
- **Current state:** Checks if `currentProposal` exists and if `clientName` is set, but doesn't validate template settings
- **Impact:** PDF generation could fail silently if critical template data is missing
- **Recommendations:** Validate all required fields before calling `generateProposalPdf()`

## Performance Bottlenecks

### Large Component Size

**Issue:** `ProposalView.tsx` is 702 lines – too large for a single component
- **Files:** `src/components/ProposalView.tsx`
- **Current state:** Handles form rendering, proposal calculation, PDF generation, and nested tab views in one component
- **Impact:** 
  - Difficult to test individual features
  - Re-renders affect entire component tree
  - State management is coupled
- **Fix approach:** 
  1. Extract form into `ProposalForm.tsx`
  2. Extract preview into `ProposalPreview.tsx`
  3. Extract finance tab into `FinanceProjection.tsx`
  4. Use context or state management to share data between components

### All Proposals Loaded at Once

**Issue:** `getAllProposals()` fetches entire collection without pagination
- **Files:** `src/App.tsx` (line 95)
- **Current state:** Loads all proposals into `savedProposalsMeta` on app startup
- **Impact:** Performance degrades linearly with proposal count; could load thousands of documents
- **Scaling limit:** Likely problematic beyond 1000+ proposals
- **Improvement path:** 
  1. Implement pagination or infinite scroll
  2. Add `createdAt` index to Firestore for efficient sorting
  3. Fetch only metadata needed for list display

### Unnecessary Re-renders in ProposalView

**Issue:** Multiple state updates trigger full component re-render
- **Files:** `src/components/ProposalView.tsx`
- **Current state:** `calculateProposal()` is called on every `formData` change (line 175) and updates `currentProposal`
- **Impact:** Preview tab will re-render even if user is editing form
- **Recommendations:** Memoize `renderProposalPreview()` and use `useMemo()` for calculated values

## Missing Critical Features

### No Offline Support

**Issue:** Entire app depends on Firebase connectivity
- **Current state:** All templates, proposals, and costs load from Firestore
- **Impact:** App is unusable if network is unavailable; no fallback to cached data
- **Recommendations:** 
  1. Cache templates and proposals in IndexedDB
  2. Show cached data if Firebase unavailable
  3. Queue writes and sync when network returns

### No Undo/Redo

**Issue:** User can lose work if they accidentally clear the form
- **Files:** `src/components/ProposalView.tsx` (line 50-70, resetForm)
- **Current state:** Clear button immediately wipes form data with no recovery
- **Impact:** Users cannot recover from accidental data loss
- **Recommendations:** 
  1. Add undo/redo stack for form changes
  2. Confirm before clearing form
  3. Auto-save draft to localStorage periodically

### No Audit Trail

**Issue:** No record of who made changes or when
- **Files:** All service files
- **Current state:** Proposals have `createdAt` but no `updatedAt` timestamp; no user tracking
- **Impact:** Cannot track changes to sensitive proposal data
- **Recommendations:** 
  1. Add `updatedAt` and `updatedBy` fields to Proposal type
  2. Create separate audit log collection in Firestore
  3. Log all save/delete operations

## Fragile Areas

### Audio Parsing Logic

**Issue:** Fragile regex patterns that fail silently
- **Files:** `src/components/AudioUpload.tsx` (lines 5-45)
- **Current state:** Multiple regex patterns try to extract city, numbers, and template; no validation of extracted data
- **Why fragile:** 
  - Regex patterns assume specific word ordering
  - No validation that numbers are sensible (e.g., quantities > 0)
  - Missing city/numbers defaults to empty without user notification
- **Safe modification:** 
  1. Add test cases for various input formats
  2. Validate extracted values before storing
  3. Show extraction results to user for confirmation (already implemented)
- **Test coverage:** No unit tests for `parseProposalData()`

### PDF Generation Logic

**Issue:** Complex image handling and page break logic
- **Files:** `src/services/pdfGenerator.ts` (lines 52-149)
- **Current state:** Multiple fallback paths for logo loading (http URL → base64 conversion, data URL, SVG viewBox parsing, default fallback)
- **Why fragile:** 
  - Heavy use of `try/catch` without specific error types
  - SVG dimension calculation assumes viewBox exists
  - No validation that converted images are valid before adding to PDF
- **Safe modification:** 
  1. Add unit tests for logo conversion
  2. Add explicit SVG handling
  3. Test with various image formats and sizes
- **Test coverage:** No tests for PDF generation; relies on manual testing

### Cost Vigency Lookup

**Issue:** Assumes cost data exists and is properly formatted
- **Files:** `src/components/ProposalView.tsx` (lines 214-226, 525-535)
- **Current state:** Hard requirement that 6 costs exist for vigency; fails with cryptic message if not
- **Why fragile:** 
  - Expects exact ID format: `{itemId}-{vigenciaInicio}`
  - No validation of cost counts or values
  - User sees generic error without guidance on fixing
- **Safe modification:** 
  1. Validate cost data integrity when loading
  2. Provide clear error messages for missing costs
  3. Add admin UI to verify cost setup
- **Test coverage:** No tests for cost lookup logic

## Testing Gaps

### Zero Automated Tests

**Issue:** No test suite exists
- **Current state:** No `.test.ts` or `.spec.ts` files; no Jest or Vitest configuration (though Vite is set up)
- **Impact:** 
  - Refactoring is risky
  - Bugs not caught until deployed
  - Cost calculation logic untested
  - PDF generation untested
  - Audio parsing untested
- **Priority:** High – this is a financial proposal system where calculation errors have direct business impact
- **Recommendations:** 
  1. Add unit tests for cost/calculation logic (highest priority)
  2. Add integration tests for Firebase operations
  3. Add component tests for form validation
  4. Aim for >80% coverage of calculation paths

### No E2E Tests

**Issue:** No user flow testing
- **Current state:** No Cypress, Playwright, or similar
- **Impact:** Cannot verify entire proposal creation → save → PDF generation flow
- **Recommendations:** Add basic E2E tests for critical workflows

## Dependencies at Risk

### Unversioned Dependencies

**Issue:** Package.json uses `^` and `~` versions allowing updates
- **Files:** `package.json`
- **Current state:** 
  - `jspdf-autotable` at `^3.8.2`
  - `firebase` at `^11.9.1`
  - `react` at `^19.1.0`
- **Risk:** Breaking changes in minor versions could break PDF generation or Firebase integration
- **Recommendations:** 
  1. Test after Firebase major version updates (they often introduce breaking changes)
  2. Pin critical dependencies to exact versions for production stability
  3. Add dependency security scanning (GitHub Dependabot)

### Missing Testing Framework

**Issue:** No test runner is installed
- **Current state:** Vite is configured but no test framework in dependencies
- **Impact:** Cannot write tests without first adding Jest/Vitest
- **Recommendations:** Add `vitest` and `@testing-library/react` to devDependencies

## Known Limitations

### No Multi-language Support

**Issue:** All text is hardcoded in Portuguese
- **Files:** Throughout codebase
- **Impact:** Cannot serve international clients
- **Recommendation:** Not urgent for current use case, but noted for future expansion

### No Responsive Image Handling

**Issue:** Logo upload assumes all images will be small enough
- **Files:** `src/components/TemplateEditorView.tsx` (line 92 checks 2MB, but no resolution checks)
- **Impact:** Very large images could cause memory issues or slow rendering
- **Recommendations:** Add image resolution validation and compression

---

*Concerns audit: 2026-04-15*
