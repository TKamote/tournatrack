# Codebase Analysis & Recommendations

## Executive Summary
This analysis identifies unused files, duplicate components, and provides recommendations for cleanup and optimization before App Store deployment.

---

## 📁 UNUSED FILES (Recommended for Removal)

### 1. **Unused Components in `src/components/`**

#### `MatchCard.tsx` ❌
- **Status**: NOT USED
- **Reason**: There are TWO other MatchCard components:
  - `src/screens/temp/components/MatchCard.tsx` (old version)
  - `src/screens/temp/components/NewMatchCard.tsx` (currently used)
- **Recommendation**: DELETE - This is a duplicate that's not imported anywhere

#### `MatchFormatSelector.tsx` ❌
- **Status**: NOT USED
- **Reason**: No imports found in the codebase
- **Recommendation**: DELETE - Format selection is handled inline in screens

---

### 2. **Unused Components in `src/screens/temp/components/`**

#### `HorizontalBracket.tsx` ❌
- **Status**: REPLACED
- **Reason**: Replaced by `NewHorizontalBracket.tsx` which is actively used
- **Dependencies**: Uses `MatchCard.tsx` (temp) and `BracketConnections.tsx`
- **Recommendation**: DELETE - Old implementation superseded

#### `MatchCard.tsx` (temp folder) ❌
- **Status**: REPLACED
- **Reason**: Replaced by `NewMatchCard.tsx` which is actively used
- **Recommendation**: DELETE - Old implementation superseded

#### `BracketConnections.tsx` ❌
- **Status**: NOT USED
- **Reason**: Only used by `HorizontalBracket.tsx` (which is unused)
- **Recommendation**: DELETE - No longer needed with new bracket design

---

### 3. **Unused Screens**

#### `src/screens/playerInput/PlayerInputScreen.tsx` ⚠️
- **Status**: PARTIALLY UNUSED
- **Reason**: 
  - Defined in navigation types but NOT in `ManagerStack.tsx`
  - Individual screens (PlayerInput4, PlayerInput8, etc.) are used instead
  - This appears to be a generic/old implementation
- **Recommendation**: 
  - If not needed, DELETE
  - If kept for future use, document or move to `/temp` folder

---

### 4. **Missing Navigation Route**

#### `TournamentBracketScreen` ⚠️
- **Status**: NOT ACCESSIBLE
- **Location**: `src/screens/temp/TournamentBracketScreen.tsx`
- **Problem**: 
  - Defined in navigation types (`RootStackParamList`)
  - NOT registered in `ManagerStack.tsx` or `AppNavigator.tsx`
  - Components are built and ready (`NewHorizontalBracket`, `NewMatchCard`, `PlayerInput`, `ManagerControls`)
- **Recommendation**: 
  - **URGENT**: Add to navigation if this is the new tournament system
  - Or remove from navigation types if not ready for production

---

## ✅ ACTIVELY USED COMPONENTS (Keep)

### `src/components/` - Used Components:
- ✅ `ScreenHeader.tsx` - Used in 13+ screens
- ✅ `MatchListItem.tsx` - Used in tournament type screens
- ✅ `MatchInfo.tsx` - Used by MatchListItem
- ✅ `MatchResults.tsx` - Used by MatchListItem
- ✅ `ConfirmActionModal.tsx` - Used in tournament screens
- ✅ `IncompleteMatchesModal.tsx` - Used in tournament screens
- ✅ `TournamentSummaryModal.tsx` - Used in tournament screens
- ✅ `RoundSeparator.tsx` - Used in tournament screens
- ✅ `TournamentCard.tsx` - Used in dashboard and profile
- ✅ `TournamentBracketView.tsx` - Used in DoubleElim8 and TournamentDetails
- ✅ `TournamentNavigation.tsx` - Potentially used (verify)

### `src/screens/temp/components/` - Used Components:
- ✅ `NewHorizontalBracket.tsx` - Used in TournamentBracketScreen
- ✅ `NewMatchCard.tsx` - Used in NewHorizontalBracket
- ✅ `PlayerInput.tsx` - Used in TournamentBracketScreen
- ✅ `ManagerControls.tsx` - Used in TournamentBracketScreen

---

## 🔍 FINDINGS & RECOMMENDATIONS

### 1. **Code Duplication**
- **Issue**: Multiple MatchCard implementations
  - `src/components/MatchCard.tsx` (unused)
  - `src/screens/temp/components/MatchCard.tsx` (old, unused)
  - `src/screens/temp/components/NewMatchCard.tsx` (current, used)
- **Impact**: Confusion, maintenance overhead
- **Recommendation**: Remove unused versions

### 2. **Temporary Folder Structure**
- **Issue**: `src/screens/temp/` contains production-ready code
- **Recommendation**: 
  - If `TournamentBracketScreen` is production-ready, move out of `/temp`
  - If not, clearly document what's in progress

### 3. **Missing Navigation Integration**
- **Issue**: `TournamentBracketScreen` is not accessible via navigation
- **Recommendation**: 
  - Add to `ManagerStack.tsx` if ready
  - Or add button in `HomeScreen.tsx` to navigate to it
  - Or remove from navigation types if not ready

### 4. **Unused Utility Functions**
- **Check**: `src/utils/tournament/progressUtils.ts` - verify all functions are used
- **Check**: `src/utils/tournament/matchUtils.ts` - verify all functions are used

---

## 📋 CLEANUP ACTION PLAN

### Phase 1: Safe Deletions (No Breaking Changes)
1. Delete `src/components/MatchCard.tsx`
2. Delete `src/components/MatchFormatSelector.tsx`
3. Delete `src/screens/temp/components/HorizontalBracket.tsx`
4. Delete `src/screens/temp/components/MatchCard.tsx`
5. Delete `src/screens/temp/components/BracketConnections.tsx`

### Phase 2: Navigation Integration
1. **Decide**: Is `TournamentBracketScreen` ready for production?
   - If YES: Add to `ManagerStack.tsx` and add navigation button in `HomeScreen`
   - If NO: Remove from `RootStackParamList` or document as WIP

### Phase 3: File Organization
1. Move production-ready files out of `/temp` folder
2. Remove or document `PlayerInputScreen.tsx` if unused
3. Review and clean up unused utility functions

### Phase 4: Final Verification
1. Run app and verify all navigation routes work
2. Check for any broken imports
3. Verify no console errors or warnings

---

## 🎯 PRIORITY RECOMMENDATIONS

### 🔴 HIGH PRIORITY (Before App Store)
1. **Fix TournamentBracketScreen navigation** - Either integrate or remove
2. **Delete unused duplicate components** - Clean up MatchCard duplicates
3. **Remove unused temp folder components** - HorizontalBracket, old MatchCard, BracketConnections

### 🟡 MEDIUM PRIORITY (Code Quality)
1. Move production code out of `/temp` folder
2. Review and document PlayerInputScreen.tsx status
3. Clean up unused utility functions

### 🟢 LOW PRIORITY (Nice to Have)
1. Consolidate component naming conventions
2. Add JSDoc comments to complex components
3. Create component usage documentation

---

## 📊 STATISTICS

- **Total Components Analyzed**: 20
- **Unused Components**: 5
- **Duplicate Components**: 3
- **Missing Navigation**: 1 screen
- **Potential Cleanup**: ~500-800 lines of unused code

---

## ✅ VERIFICATION CHECKLIST

Before deleting files, verify:
- [ ] No imports reference the file
- [ ] File is not in git history as critical (if needed for rollback)
- [ ] No tests reference the file
- [ ] Documentation doesn't reference the file
- [ ] Run app and test all features still work

---

**Generated**: Analysis of tournatrack-local codebase
**Focus**: Pre-deployment cleanup and optimization

