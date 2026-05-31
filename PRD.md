# Planning Guide

A visual component builder that enables users to add features via buttons and see real-time previews of their interface configuration, with the ability to export structured JSON data.

**Experience Qualities**: 
1. **Interactive** - Users should feel immediate control as they build their interface, seeing instant feedback in the preview area
2. **Intuitive** - The drag-free workflow makes feature addition feel natural and discoverable through clear visual hierarchy
3. **Professional** - The tool should feel like a developer-grade interface builder with clean aesthetics and precise controls

**Complexity Level**: Light Application (multiple features with basic state)
This is a configuration tool with state management for features, navigation items, and export functionality - more than a single-purpose tool but not requiring complex workflows or multiple views.

## Essential Features

### Horizontal Feature Button Bar
- **Functionality**: Displays available features as toggleable buttons in a horizontally scrolling container
- **Purpose**: Provides quick access to all available features without cluttering the interface
- **Trigger**: Page load displays all feature buttons
- **Progression**: User views buttons → scrolls horizontally if needed → clicks to toggle features on/off
- **Success criteria**: Buttons scroll smoothly, active state is clearly visible, clicking toggles feature in preview

### Navigation Drawer Feature
- **Functionality**: Adds a navigation drawer to the preview with hamburger menu, three display states (open, closed, icons-only), and configurable navigation items
- **Purpose**: Demonstrates a common UI pattern with state management and customization
- **Trigger**: Clicking "Add Navigation" button
- **Progression**: Click button → drawer appears in preview with hamburger icon → click hamburger → drawer opens → configure items in settings panel
- **Success criteria**: Drawer animates smoothly between states, hamburger icon animates, navigation items display correctly

### Navigation Link Management
- **Functionality**: When navigation is enabled, displays a section to add/edit navigation links with title, link, and icon fields
- **Purpose**: Allows customization of navigation items that appear in the drawer
- **Trigger**: Navigation feature is enabled
- **Progression**: Navigation enabled → link management section appears → click "Add Link" → form appears → fill title/link → link appears in both settings and preview
- **Success criteria**: Links can be added, edited, removed; changes reflect immediately in preview drawer

### JSON Export
- **Functionality**: Generates and displays structured JSON representation of the current configuration
- **Purpose**: Allows users to save and share their configuration data
- **Trigger**: Clicking "Export" button
- **Progression**: Click Export → dialog opens → JSON displayed in readable format → user can copy data
- **Success criteria**: JSON is properly formatted, includes all configuration data with correct structure, dialog is easy to dismiss

## Edge Case Handling
- **Empty Navigation**: If navigation drawer is enabled but no links added, show placeholder text in drawer
- **Duplicate Links**: Allow multiple links with same title (use unique IDs internally)
- **Long Titles**: Truncate or wrap long navigation item titles gracefully in icons-only mode
- **No Features Enabled**: Preview shows empty state with helpful message to add features
- **JSON Structure**: Generate valid JSON even with empty or partial configurations

## Design Direction
The design should feel like a developer tool - clean, precise, and functional with a modern tech aesthetic. The interface should communicate capability and control while remaining approachable.

## Color Selection
A technical, code-editor inspired palette with purple/indigo accents for a modern developer tool feel.

- **Primary Color**: Deep indigo (oklch(0.35 0.15 275)) - Conveys professionalism and technical sophistication
- **Secondary Colors**: Slate grays (oklch(0.25 0.01 260) to oklch(0.85 0.01 260)) for hierarchy and depth
- **Accent Color**: Vibrant purple (oklch(0.65 0.25 290)) for interactive elements and active states
- **Foreground/Background Pairings**: 
  - Background (Dark slate oklch(0.15 0.02 260)): Light text (oklch(0.95 0.01 260)) - Ratio 11.2:1 ✓
  - Accent (Vibrant purple oklch(0.65 0.25 290)): White text (oklch(1 0 0)) - Ratio 5.1:1 ✓
  - Card (Medium slate oklch(0.20 0.02 260)): Light text (oklch(0.95 0.01 260)) - Ratio 8.9:1 ✓

## Font Selection
A monospace-inspired typeface for the technical aesthetic with a clean sans-serif for labels, conveying precision and developer-focused functionality.

- **Typographic Hierarchy**:
  - H1 (Page Title): JetBrains Mono Bold/24px/tight letter spacing
  - H2 (Section Headers): JetBrains Mono Medium/18px/normal letter spacing
  - Body (Interface Labels): Inter Medium/14px/normal letter spacing
  - Code (JSON Export): JetBrains Mono Regular/13px/normal letter spacing
  - Buttons: Inter Semibold/14px/wide letter spacing

## Animations
Animations should reinforce the builder metaphor - features "appear" in the preview, the drawer "slides" into view, and state changes should feel mechanical and precise. Keep animations quick (200-300ms) to maintain a snappy, responsive feel that doesn't impede workflow.

## Component Selection
- **Components**: 
  - Button (feature toggles with active states)
  - Sheet/Drawer (navigation drawer in preview, using vaul for smooth drawer behavior)
  - Dialog (JSON export modal)
  - Card (preview container and settings panels)
  - Input (link title, URL fields)
  - Label (form labels)
  - ScrollArea (horizontal feature button container)
  - Separator (visual division between sections)
  - Badge (feature status indicators)
  
- **Customizations**: 
  - Custom hamburger menu icon with animated state (three horizontal lines → X)
  - Custom horizontal scroll container with fade edges
  - Custom preview frame with border styling to look like a device/window
  
- **States**: 
  - Buttons have distinct enabled/disabled states with accent color background when active
  - Navigation drawer has three distinct visual states (closed, icons-only with 60px width, open with 240px width)
  - Inputs have clear focus states with accent color ring
  - Export dialog has copy-to-clipboard feedback
  
- **Icon Selection**: 
  - Hamburger menu: Three horizontal lines (Lucide List)
  - Close: X icon (Lucide X)
  - Add link: Plus icon (Lucide Plus)
  - Export: Download icon (Lucide Download)
  - Default nav link: Home icon (Lucide Home)
  
- **Spacing**: 
  - Container padding: p-6 (24px)
  - Section gaps: gap-6 (24px)
  - Card padding: p-4 (16px)
  - Button groups: gap-2 (8px)
  - Form fields: gap-4 (16px)
  
- **Mobile**: 
  - Feature buttons remain horizontal scroll on mobile but with smaller padding
  - Preview scales down to maintain aspect ratio
  - Export dialog fills more of screen on mobile
  - Navigation management section stacks vertically
  - Touch targets remain minimum 44px height
