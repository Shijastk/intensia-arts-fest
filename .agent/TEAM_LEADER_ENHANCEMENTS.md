# Team Leader Page - Program Search & Sorting Features

## Summary
Added search and sorting functionality to the program list in the Team Leader page's participant registration modal.

## Changes Made

### 1. New State Variables
Added two new state variables in the `ParticipantProgramModal` component:
- `programSearchTerm`: Stores the search query for filtering programs
- `programSortBy`: Stores the selected sort option ('name', 'category', or 'time')

### 2. Filter & Sort Logic
Implemented a `useMemo` hook called `filteredAndSortedPrograms` that:
- **Filters programs** based on search term (searches in program name, category, and venue)
- **Sorts programs** by:
  - Name (alphabetically)
  - Category (alphabetically)
  - Time (chronologically, with programs without time at the end)

### 3. UI Enhancements
Added search and sort controls in the program selection section:
- **Search Input**: 
  - Placeholder: "Search programs..."
  - Icon: Magnifying glass
  - Searches across program name, category, and venue
  
- **Sort Dropdown**:
  - Options: Sort by Name, Sort by Category, Sort by Time
  - Default: Sort by Name

- **Program Counter**:
  - Shows filtered count vs total available programs
  - Format: "X/Y" (e.g., "5/10")

- **Empty State**:
  - Shows "No programs match your search" when search returns no results
  - Provides helpful message to try different search term

## Features

### Search Functionality
- Real-time filtering as user types
- Case-insensitive search
- Searches in multiple fields (name, category, venue)

### Sorting Options
1. **By Name**: Alphabetical order of program names
2. **By Category**: Groups programs by category alphabetically
3. **By Time**: Chronological order based on start time (programs without time appear last)

### User Experience
- Responsive design (mobile and desktop friendly)
- Consistent styling with existing UI
- Clear visual feedback
- Maintains all existing validation and limit checks

## Technical Details

### Dependencies
- Uses React's `useMemo` hook for performance optimization
- No additional external libraries required

### Performance
- Memoized filtering and sorting prevents unnecessary recalculations
- Only recalculates when `availablePrograms`, `programSearchTerm`, or `programSortBy` changes

## Testing Recommendations
1. Test search with various program names, categories, and venues
2. Verify sorting works correctly for all three options
3. Check that program limits and validations still work with filtered results
4. Test responsive behavior on mobile devices
5. Verify empty states display correctly
