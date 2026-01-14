# AGENTS.md - Coding Agent Guidelines

This document provides guidelines for AI coding agents working on the **order-simulation-system** project.

## Project Overview

A Next.js 16 application simulating order processing with Azure Service Bus message queues. Orders flow through stages: created -> prepared -> shipped -> invoiced. The UI uses Polish language. Supports both real Azure services and mock in-memory storage for development.

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5 (strict mode)
- **React**: 19.2.3 with React Compiler enabled
- **Styling**: Tailwind CSS v4
- **Azure**: Service Bus, Table Storage
- **Package Manager**: npm

## Build/Lint/Test Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Linting (ESLint 9)
npx tsc --noEmit # Type checking
```

**Testing**: No test framework configured. If adding tests, use Vitest with `*.test.ts` files.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (route.ts files)
│   ├── generator/         # Order generator page
│   ├── page.tsx           # Dashboard (home)
│   └── layout.tsx         # Root layout
├── components/            # React components
└── lib/                   # Shared utilities
    ├── types.ts           # TypeScript type definitions
    ├── utils.ts           # Utility functions
    └── azure/             # Azure service clients
```

## Code Style Guidelines

### Imports

Order by category; use `@/*` path alias for `src/` imports:

```typescript
import { NextResponse } from 'next/server';
import { sendToQueue, QUEUE_NAMES } from '@/lib/azure/service-bus';
import type { ApiResponse, Order } from '@/lib/types';
```

### TypeScript

- **Strict mode enabled** - no implicit `any`, strict null checks
- Use `interface` for object shapes, `type` for unions
- Use `ApiResponse<T>` pattern for API responses

```typescript
export interface Order { id: string; products: Product[]; status: OrderStatus; }
export type OrderStatus = 'created' | 'prepared' | 'shipped' | 'invoiced';
export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files/folders | kebab-case | `service-bus.ts` |
| Components | PascalCase | `EventsTable.tsx` |
| Functions | camelCase | `generateRandomOrder` |
| Constants | SCREAMING_SNAKE_CASE | `QUEUE_NAMES` |
| Types/Interfaces | PascalCase | `OrderEvent` |

### React Components

```typescript
'use client';  // Required for client components

import type { OrderEvent } from '@/lib/types';

interface EventsTableProps {
  events: OrderEvent[];
  isLoading?: boolean;
}

export default function EventsTable({ events, isLoading }: EventsTableProps) {
  // Props interface named {ComponentName}Props, use default export
}
```

### API Routes (Next.js App Router)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // ... logic
    const response: ApiResponse<ResultType> = { success: true, data: result };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[ServiceName] Error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
```

### Error Handling

1. **Always use try/catch** in async functions and API routes
2. **Log errors** with context prefix: `console.error('[ServiceName] Error:', error)`
3. **Type-check errors**: `error instanceof Error ? error.message : 'fallback'`
4. **Return graceful fallbacks** when possible (e.g., empty arrays, zero counts)

### Styling (Tailwind CSS v4)

- **Dark theme**: Background `bg-gray-950`, text `text-white`
- Use utility classes directly in JSX
- Responsive prefixes: `sm:`, `md:`, `lg:`

### Environment Variables

Required (see `.env.local.example`):
- `AZURE_SERVICE_BUS_CONNECTION_STRING`
- `AZURE_STORAGE_CONNECTION_STRING`
- `USE_MOCK_STORAGE` - Set to `true` for development without Azure

### Best Practices

1. Prefer async/await over raw promises
2. Use optional chaining: `process.env.VAR?.trim()`
3. Close resources in finally blocks (e.g., Service Bus senders/receivers)
4. Support mock mode - check `useMock` flag before using real Azure clients
5. UUID generation: Use `uuid` package with `v4 as uuidv4`

### UI Language

The UI is in **Polish**. Keep user-facing strings in Polish:
- "Zamówienie" (Order), "Ładowanie..." (Loading...), "Brak zdarzeń" (No events)
