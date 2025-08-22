# Complete Sidebar Implementation Plan

## Step 1: Extract Chat Messages Component

**File:** `packages/ai-builder/src/components/formedible/ai/chat-messages.tsx`

- Copy everything from ChatInterface except the wrapper div
- Keep all message rendering, input handling, streaming logic
- Same props as ChatInterface
- Export as ChatMessages

## Step 2: Create Sidebar Icon Bar

**File:** `packages/ai-builder/src/components/formedible/ai/sidebar-icons.tsx`

- Collapse/expand button at top
- 3 vertical icons: History, Settings, Provider
- Active state styling
- onClick handlers to change active view

## Step 3: Create Sidebar Content Panel

**File:** `packages/ai-builder/src/components/formedible/ai/sidebar-content.tsx`

- Switch statement based on active view
- History: render existing ConversationHistory component WITH ADAPTED DESING. MUST STAY COMPATIBLE, NO STUPID REENGINEERING
- agent Settings: render model selection, temperature/maxTokens and every model related controls
- Provider: render existing ProviderSelection component
- Collapsible with animation

## Step 4: Create Agent Settings Panel

**File:** `packages/ai-builder/src/components/formedible/ai/agent-settings.tsx`

- Model selection
- Temperature slider (0-1)
- Max tokens input
- Takes providerConfig as prop
- onConfigChange callback
- Simple form layout

## Step 5: Update ChatInterface to Sidebar Layout

**File:** `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`

- Replace content with sidebar layout
- SidebarProvider wrapper
- Left: SidebarIcons
- Middle: SidebarContent (collapsible)
- Right: ChatMessages
- Manage active sidebar view state
- Keep same ChatInterface export name and props interface

## Step 6: Update AI Builder

**File:** `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`

- Remove ProviderSelection from top section grid
- Remove ConversationHistory from top section grid
- Keep all conversation logic unchanged
- Keep all state management unchanged
- ChatInterface import remains the same

## Step 7: Update Registry

**File:** `packages/ai-builder/registry.json`

- Add new component files to registry
- Add sidebar, tooltip, separator to registryDependencies
- Keep existing component entries
