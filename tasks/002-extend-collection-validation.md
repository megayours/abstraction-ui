# Extend Collection Validation Feature

Implement validation and security rules for extended collections and their tokens.

## Completed Tasks
- [x] Modify token detection to store source, id, and uri instead of fetching metadata
  - Removed metadata fetching from `nftUtils.ts`
  - Simplified `DetectedTokenData` interface
  - Updated `fetchErc721UrisViaEnumeration` to only fetch token IDs and URIs
- [x] Implement module protection for extended collections

## In Progress Tasks

## Future Tasks
- [ ] Add token validation before editing
- [ ] Update token editing UI to respect validation rules

## Implementation Plan

### 1. Modify Token Detection ✅
- Update `ExtendCollectionWizard.tsx` to store only:
  - source (chain name)
  - id (token ID)
  - uri (token URI)
- Remove metadata fetching logic
- Update token creation to pass these fields to the API

### 2. Module Protection
- Add validation in the token editing UI to prevent removal of:
  - `extending_metadata` module
  - `extending_collection` module
- Add visual indicators for protected modules
- Add tooltips explaining why modules can't be removed

### 3. Token Validation
- Implement validation endpoint call before allowing token edits
- Add error handling for unauthorized edits
- Update UI to show validation status
- Add loading states during validation

## Relevant Files
- `src/app/megadata/components/ExtendCollectionWizard.tsx` - Main component to modify
- `src/app/megadata/[collectionId]/page.tsx` - Token editing UI
- `src/lib/api/megadata.ts` - API integration
- `src/app/megadata/components/TokenEditor.tsx` - Token editing component

## API Changes
- Use `/megadata/collections/{collection_id}/tokens/{token_id}/validate` endpoint
- Response handling for validation status
- Error handling for unauthorized access

## UI/UX Considerations
- Clear feedback for protected modules
- Validation status indicators
- Error messages for unauthorized actions
- Loading states during validation 