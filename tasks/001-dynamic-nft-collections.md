# Dynamic NFT Collections Implementation

This feature allows users to create new dynamic NFT collections and extend metadata for existing collections.

## Completed Tasks
- [x] Basic megadata implementation (existing feature)
- [x] Auto-detection of tokens from inputed contract
- [x] Fetching of available modules and their schemas from our megadata API
- [x] Create new page for Dynamic NFT Collections Creation with two main options:
  - Create new dynamic NFT collection
  - Extend existing collection metadata
- [x] Implement collection creation flow:
  - Collection name input
  - Optional token count and starting index
  - Module selection from existing megadata API
- [x] Implement collection extension flow:
  - Contract address input
  - Auto-detect collection type (ERC721)
  - Auto-select appropriate module based on the collection type selection, e.g. type ERC721 => module erc721
  - Optional additional module selection
  - Collection name handling:
    - Attempt to fetch from contract via the contracts on-chain metadata standard, e.g. ERC721 => IERC721Metadata.name
    - Fallback to user input if not available
- [x] Add support to megadata page to open a collection by its id via the route, e.g. `/megadata/{collectionId}`
- [x] Navigate to the collection after creating it

## In Progress Tasks
- [ ] Implement collection update notifications

## Future Tasks
- [ ] Implement collection update notifications

## Implementation Plan
1. Create new page at `/dynamic-nft-collections` with two main sections:
   - Create New Collection
   - Extend Existing Collection

2. Create New Collection Flow:
   - Simple form with:
     - Collection name (required)
     - Token count (optional)
     - Starting index (optional)
   - Module selection interface:
     - List available modules from API (but filter out `extending_metadata` since that one is for the other flow)
     - Allow multiple module selection
     - Show module descriptions

3. Extend Existing Collection Flow:
   - Contract address input
   - Auto-detection of:
     - Collection type
     - Collection name
   - Module selection:
     - Auto-select ERC721 if the collection type is applicable
     - Allow additional module selection (but filter out the applicable type since that is auto-selected)
   - Fallback name input if contract name not available

4. Reuse existing components:
   - `CreateCollectionWizard` for base structure
   - `DynamicForm` for module configuration
   - Token detection logic from existing implementation

## Relevant Files
- `src/app/dynamic-nft-collections/page.tsx` - Main page for dynamic NFT collections
- `src/app/megadata/components/CreateCollectionWizard.tsx` - Base for collection creation
- `src/app/megadata/components/ExtendCollectionWizard.tsx` - New component for extending collections
- `src/app/megadata/components/DynamicForm.tsx` - Base for dynamic form handling
- `src/app/megadata/components/ImagePickerDialog.tsx` - Base for asset upload
- `src/app/megadata/utils/` - Token detection and contract interaction
- `src/lib/api/megadata.ts` - API integration for collection and token management
- `src/lib/blockchain/nftUtils.ts` - Token detection and metadata fetching utilities 