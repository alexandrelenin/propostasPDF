# Codebase Concerns

**Analysis Date:** 2026-04-20

---

## [FIXED] Items Resolved Since 2026-04-15

**[FIXED] NaN total in first table**
- `unitPrice` now uses `?? 0` fallback at `src/components/ProposalView.tsx:134`
- `formatCurrency` now has `isNaN(value)` guard at `src/utils/formatters.ts:2`

**[FIXED] Duplicate default template bug**
- `TemplatesView` now calls `setDefaultTemplate()` correctly; no longer creates multiple defaults

**[FIXED] Template not updating on navigation**
- `useEffect` in `src/App.tsx:122` now depends on `location.pathname`, ensuring templates reload on route change

**[FIXED] All-proposals re-fetch on every navigation**
- Separado em dois effects: proposals fetched uma vez no mount (`[]`); templates recarregam em navegação (`[location.pathname]`)
- `src/App.tsx` — linhas 93-123

---

## Security Concerns

### Exposed Firebase API Key

**Risk:** Firebase API key hardcoded in public source code
- **Files:** `src/services/firebase.ts` (line 6)
- **Current state:** `apiKey: "AIzaSyCuqDzr5tlvrjju9AnoI627YxU6yme-NDc"` committed to repository
- **Impact:** Firebase project accessible to anyone with repo access; risk escalates if Firestore security rules are weak
- **Mitigation needed:** Firebase web keys are public-safe by design only when paired with strong security rules, but hardcoding is still bad practice
- **Recommendations:**
  1. Move Firebase config to `.env.local` and load via `import.meta.env`
  2. Verify Firestore security rules restrict unauthorized access
  3. Add `.env.local` to `.gitignore`

### Cloudinary Credentials Exposed

**Risk:** Cloudinary cloud name and upload preset hardcoded
- **Files:** `src/components/TemplateEditorView.tsx` (lines 6-7)
- **Current state:** `CLOUDINARY_CLOUD_NAME = "dfezexws1"` and `CLOUDINARY_UPLOAD_PRESET = "propostasPDF"` visible in source
- **Impact:** Unsigned preset enables unrestricted uploads to the cloud account; abuse potential for storage exhaustion
- **Recommendations:**
  1. Move to environment variables
  2. Add rate limiting or signed uploads on Cloudinary side
  3. Add server-side file type/size validation

### Weak Error Handling in Audio Upload

**Risk:** Generic error messages hide actual issues
- **Files:** `src/components/AudioUpload.tsx` (lines 112-113)
- **Current state:** `catch (err) { setError('Erro ao enviar áudio'); }` swallows all error details
- **Impact:** API failures are not properly reported; difficult to debug
- **Recommendations:** Log error details to console; distinguish network vs. transcription service errors

---

## Tech Debt

### Empty Storage Manager File

**Issue:** Placeholder file with no implementation
- **Files:** `src/services/storageManager.ts`
- **Current state:** File exists but contains only empty lines
- **Impact:** Misleading – appears to be a service layer but is completely unused
- **Fix approach:** Either implement or delete the file

### Repetitive Firebase Query Logic

**Issue:** Similar `getDocs()` patterns repeated across service files independently
- **Files:**
  - `src/services/templateService.ts`
  - `src/services/proposalService.ts`
  - `src/services/costService.ts`
- **Impact:** Any change to query patterns must be replicated in all three files
- **Fix approach:** Extract a generic Firebase service layer with reusable query/update methods

### Type Casting Without Validation

**Issue:** Direct `as Template` and `as Proposal` casts without runtime validation
- **Files:**
  - `src/services/templateService.ts` (lines 16, 22, 47)
  - `src/services/proposalService.ts` (lines 13, 19)
  - `src/services/costService.ts` (lines 13, 19)
- **Current state:** `doc.data() as Template` assumes Firestore data matches the TypeScript type
- **Impact:** Runtime errors if Firestore schema changes or contains malformed data
- **Fix approach:** Add Zod or similar runtime validation at service boundaries

### Bare `catch` Handlers with Empty Blocks

**Issue:** Silent error swallowing in JSON parsing
- **Files:** `src/components/ProposalView.tsx` (line 91)
- **Current state:** `try { JSON.parse(...) } catch {}` silently fails without logging
- **Impact:** Bugs in localStorage consumption go unnoticed
- **Recommendations:** Add at minimum a `console.error` in the catch block

### RFID Template Bypass of Cost Validation

**Issue:** RFID template type bypasses cost vigency validation entirely
- **Files:** `src/components/ProposalView.tsx` (lines 218-221)
- **Current state:** `if (templateSettings.templateType === 'rfid') { onSaveProposal({ ...currentProposal, costVigencia: '' }); return; }`
- **Impact:** If other template types besides `standard` and `rfid` are added in the future, the bypass logic will need to be updated; easy to forget. Also, RFID proposals have no cost tracking at all.
- **Risk:** Low for now (only two template types), but fragile as feature set grows

---

## Error Handling Gaps

### Missing Error Boundaries

**Issue:** No React error boundaries wrapping the application
- **Files:** `src/App.tsx`, all route-level components
- **Current state:** No `ErrorBoundary` components exist anywhere
- **Impact:** Any unhandled component exception crashes the entire app
- **Recommendations:** Wrap `App.tsx` and each major route section with an error boundary

### Unhandled Promise Rejections

**Issue:** Fire-and-forget async operations with no error handling
- **Files:**
  - `src/App.tsx` (lines 94-122) — `fetchProposalsAndTemplates()` has no `.catch()` or try/catch
  - `src/components/ProposalView.tsx` (line 187)
- **Impact:** If Firebase calls fail, state becomes inconsistent; no user feedback, no retry logic
- **Fix approach:**
  1. Add try/catch inside all async `useEffect` functions
  2. Call `showSystemMessage` with an error if data loads fail
  3. Add retry logic for critical Firestore reads

### Missing Validation Before PDF Generation

**Issue:** No full validation of template settings before generating PDF
- **Files:** `src/components/ProposalView.tsx` (lines 233-252)
- **Current state:** Checks `currentProposal` and `clientName` but not whether template data (logo URL, contact info) is valid
- **Impact:** PDF generation can fail silently if critical template data is missing
- **Recommendations:** Validate all required fields and provide clear error messages before calling `generateProposalPdf()`

---

## Performance Bottlenecks

### Large Component: ProposalView.tsx

**Issue:** `ProposalView.tsx` is 738 lines — too large for a single component
- **Files:** `src/components/ProposalView.tsx`
- **Current state:** Handles form rendering, proposal calculation, PDF generation, cost vigency lookup, and nested tab views in one file
- **Impact:**
  - Difficult to test individual features
  - Re-renders affect the entire component tree
  - State management is tightly coupled
- **Fix approach:**
  1. Extract form into `ProposalForm.tsx`
  2. Extract preview into `ProposalPreview.tsx`
  3. Extract finance tab into `FinanceProjection.tsx`
  4. Share data via context or lifted state

### All Proposals Loaded at Once

**Issue:** `getAllProposals()` fetches entire Firestore collection without pagination
- **Files:** `src/App.tsx` (line 95)
- **Current state:** Loads all proposals into memory on every route change (due to `location.pathname` dependency added in the template-reload fix)
- **Impact:** Performance degrades with proposal count; now triggered on every navigation, not just app startup
- **Scaling limit:** Likely problematic beyond ~500 proposals
- **Improvement path:**
  1. Implement pagination or cursor-based Firestore queries
  2. Cache results and only re-fetch when a write occurs
  3. Fetch only metadata needed for the list view

### Unnecessary Re-renders in ProposalView

**Issue:** Multiple state updates trigger full component re-render
- **Files:** `src/components/ProposalView.tsx`
- **Current state:** `calculateProposal()` runs on every `formData` change and updates `currentProposal`
- **Impact:** Preview tab re-renders even while user is actively editing the form
- **Recommendations:** Use `useMemo()` for calculated values; memoize `renderProposalPreview()`

---

## Fragile Areas

### Cost Vigency Lookup

**Issue:** Assumes cost data exists and is exactly formatted
- **Files:** `src/components/ProposalView.tsx` (lines 223-234)
- **Current state:** Requires exactly 6 cost entries matching the `{itemId}-{vigenciaInicio}` ID format; fails with a generic message if not
- **Why fragile:**
  - Hardcoded count of 6; breaks if cost categories change
  - Exact string ID format assumed with no defensive check
  - Error message does not guide the user toward a fix
- **Note:** RFID templates bypass this entirely (lines 218-221), which avoids the fragility for that use case but also means RFID proposals have no cost data at all
- **Safe modification:**
  1. Validate cost data integrity when loading costs
  2. Replace hardcoded `6` with a derived constant from cost category definitions
  3. Provide actionable error messages directing the user to the cost configuration screen

### Audio Parsing Logic

**Issue:** Fragile regex patterns that fail silently
- **Files:** `src/components/AudioUpload.tsx` (lines 5-45)
- **Current state:** Multiple regex patterns extract city, numbers, and template type; no validation of extracted values
- **Why fragile:**
  - Patterns assume specific word ordering
  - Missing city/numbers default to empty without user notification
  - No unit tests for `parseProposalData()`
- **Safe modification:**
  1. Show extraction results to user for confirmation before applying (partially done)
  2. Validate that extracted numbers are sensible (quantity > 0)
  3. Add unit tests covering varied input formats

### PDF Generation Logic

**Issue:** Complex image handling and page-break logic with multiple silent failure paths
- **Files:** `src/services/pdfGenerator.ts` (lines 52-149)
- **Current state:** Multiple fallback paths for logo loading (HTTP URL → base64 conversion → data URL → SVG viewBox parsing → default fallback)
- **Why fragile:**
  - Heavy use of `try/catch` without distinguishing error types
  - SVG dimension calculation assumes `viewBox` attribute exists
  - Converted images are not validated before being added to the PDF
- **Safe modification:**
  1. Add explicit SVG handling with viewBox fallback dimensions
  2. Test with various image formats (SVG, PNG, JPEG, WebP)
  3. Add unit tests for logo conversion paths

---

## Testing Gaps

### Zero Automated Tests

**Issue:** No test suite exists in the project
- **Current state:** No `.test.ts` or `.spec.ts` files in `src/`; no Jest or Vitest configuration; no test runner installed as a dependency
- **Impact:**
  - Refactoring is risky with no regression safety net
  - Cost calculation logic is entirely untested — this is a financial proposal system
  - PDF generation untested
  - Audio parsing untested
  - Recent RFID feature added without test coverage
- **Priority:** High — calculation errors have direct business impact
- **Recommendations:**
  1. Install `vitest` and `@testing-library/react` as devDependencies
  2. Add unit tests for `calculateProposal()` and cost vigency lookup (highest priority)
  3. Add unit tests for `parseProposalData()` in AudioUpload
  4. Add unit tests for `formatCurrency` (now that the `isNaN` fix is in place, regressions are possible)
  5. Aim for >80% coverage of calculation paths

### No E2E Tests

**Issue:** No user flow testing
- **Current state:** No Cypress, Playwright, or similar framework
- **Impact:** Cannot verify the full proposal creation → save → PDF generation flow automatically
- **Recommendations:** Add basic E2E tests for the critical proposal workflow

---

## Missing Critical Features

### No Offline Support

**Issue:** App depends entirely on Firebase connectivity
- **Current state:** All templates, proposals, and costs load from Firestore with no local cache
- **Impact:** App is unusable if network is unavailable
- **Recommendations:**
  1. Cache templates and proposals in IndexedDB
  2. Show cached data when Firebase is unavailable
  3. Queue writes and sync when connectivity returns

### No Undo/Redo

**Issue:** Users can lose work by accidentally clearing the form
- **Files:** `src/components/ProposalView.tsx` (lines 50-70, `resetForm`)
- **Current state:** Clear button immediately wipes form data with no confirmation or recovery
- **Recommendations:**
  1. Add a confirmation dialog before clearing
  2. Auto-save draft to localStorage periodically
  3. Optionally add an undo stack for form changes

### No Audit Trail

**Issue:** No record of who changed a proposal or when
- **Files:** All service files
- **Current state:** Proposals have `createdAt` but no `updatedAt`; no user identity is tracked
- **Recommendations:**
  1. Add `updatedAt` and `updatedBy` fields to the `Proposal` type
  2. Log all save/delete operations to a Firestore audit collection

---

## Dependencies at Risk

### Unversioned Dependencies

**Issue:** `package.json` uses `^` versions allowing automatic minor/patch updates
- **Files:** `package.json`
- **Notable packages:**
  - `firebase` at `^11.9.1` — Firebase major versions frequently contain breaking changes
  - `jspdf-autotable` at `^3.8.2` — PDF layout changes could break generated documents
  - `react` at `^19.1.0`
- **Recommendations:**
  1. Pin critical dependencies to exact versions for production stability
  2. Add GitHub Dependabot for security scanning

### Missing Testing Framework in Dependencies

**Issue:** No test runner is installed
- **Current state:** Vite is configured but `vitest` and `@testing-library/react` are absent from `package.json`
- **Impact:** Cannot add tests without first installing the framework
- **Recommendations:** Add `vitest` and `@testing-library/react` to `devDependencies`

---

## Known Limitations

### No Multi-language Support

**Issue:** All UI text hardcoded in Portuguese
- **Files:** Throughout codebase
- **Impact:** Cannot serve international clients
- **Recommendation:** Not urgent for current use case; noted for future

### No Responsive Image Validation

**Issue:** Logo upload checks file size (2MB) but not image resolution
- **Files:** `src/components/TemplateEditorView.tsx` (line 92)
- **Impact:** Very high-resolution images could cause memory issues or slow PDF rendering
- **Recommendations:** Add client-side image resolution check and compression before upload

---

*Concerns audit: 2026-04-20*
