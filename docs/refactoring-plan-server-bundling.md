# Refactoring Plan: Prevent Server-Side Code Bundling

**Objective:** Refactor the application to ensure server-side Node.js modules (`net`, `child_process`, `fs/promises`, `tls`, `dns`, `fs`, `timers/promises`) are not bundled with the client code, resolving "Module not found" errors. This will be achieved by moving all server-side logic, including database access and caching, to dedicated API routes and updating client-side components to interact with these routes.

**Current Architecture (Simplified - Problematic):**

```mermaid
graph TD
    A[Client-side Component/Hook] -->|Imports/Uses| B[lib/hooks/useMarketData.js]
    B -->|Imports/Uses| C[lib/services/marketDataService.js]
    C -->|Imports/Uses| D[lib/services/secureMarketDataService.ts]
    D -->|Imports/Uses| E[lib/cache.ts]
    E -->|Imports/Uses| F[lib/mongo.js/ts]
    D -->|Imports/Uses| G[External API Services (CoinGecko, etc.)]
    E -->|Imports/Uses| F
```

**Target Architecture:**

```mermaid
graph TD
    A[Client-side Component/Hook] -->|Fetches Data from| B(API Routes)
    B -->|Uses Server-side Logic| C[lib/services/marketDataService.js]
    C -->|Uses Server-side Logic| D[lib/services/secureMarketDataService.ts]
    D -->|Uses Server-side Logic| E[lib/cache.ts]
    E -->|Uses Server-side Logic| F[lib/db/mongodb.ts]
    D -->|Uses Server-side Logic| G[External API Services (CoinGecko, etc.)]

    B1[/api/market-data/popular]
    B2[/api/market-data/price/[symbol]]
    B3[/api/market-data/historical/[symbol]]
    B4[/api/market-data/search]
    B5[/api/market-data/assets]
    B6[/api/market-data/overview]

    B --> B1 & B2 & B3 & B4 & B5 & B6
```

**Detailed Step-by-Step Plan for `Code` Mode:**

This plan outlines the necessary file modifications and creations. Each step should be implemented sequentially.

**Step 1: Refactor `lib/hooks/useMarketData.js`**

*   **File:** `lib/hooks/useMarketData.js`
*   **Action:** Modify
*   **Description:** Update the hook to fetch data from the new API routes instead of directly calling service methods that might pull in server-side dependencies. Remove all imports and logic related to client-side MongoDB/caching.
*   **Specific Changes:**
    *   Remove imports: `import { MarketDataService } from '../services/marketDataService';`, `import '../services/mongoDbCacheService'`, `let mongoDbCache = null; if (typeof window !== 'undefined') { ... }`, `safeExecuteMongo` function.
    *   Remove the `marketDataService` instance creation: `const marketDataService = new MarketDataService();`.
    *   Update `fetchHistoricalData` to use `fetch` to `/api/market-data/historical/${assetSymbol}?days=${days}`.
    *   Update `searchAssets` to use `fetch` to `/api/market-data/search?q=${query}&limit=${memoizedOptions.limit}`.
    *   Update `fetchAssetBySymbol` to use `fetch` to `/api/market-data/price/${assetSymbol}` and potentially `/api/market-data/assets?symbol=${assetSymbol}` if asset details are needed separately from price.
    *   Update `fetchMarketData` to use `fetch` to `/api/market-data/assets?type=${memoizedOptions.type}&limit=${memoizedOptions.limit}` (if type is present) or `/api/market-data/popular?limit=${memoizedOptions.limit}` (if no type).
    *   Update the `useEffect` hook to call the refactored fetch functions.
    *   Adjust state updates and error handling to work with API responses.

**Step 2: Refactor `app/api/market-data/assets/route.ts`**

*   **File:** `app/api/market-data/assets/route.ts`
*   **Action:** Modify
*   **Description:** This route currently bypasses the main `marketDataService`. Refactor it to use `marketDataService.listAvailableAssets` to ensure consistency and leverage the existing server-side logic (including caching).
*   **Specific Changes:**
    *   Remove the inlined `ExternalApiService` and related types (`MarketAsset`, `TYPE_CATEGORY_MAP`).
    *   Import `marketDataService` and necessary types from `lib/`.
    *   In the `GET` handler, call `const assets = await marketDataService.listAvailableAssets({ category: filterCategory, pageSize: limit });`.
    *   Adjust response structure if necessary to match what `useMarketData` will expect.

**Step 3: Create `app/api/market-data/overview/route.ts`**

*   **File:** `app/api/market-data/overview/route.ts`
*   **Action:** Create
*   **Description:** Create a new API route to expose the market overview data.
*   **Specific Changes:**
    *   Import `NextRequest`, `NextResponse` from `next/server`.
    *   Import `marketDataService` from `../../../../lib/services/marketDataService`.
    *   Define an `async function GET(request: NextRequest)`.
    *   Inside the `GET` function, call `const overview = await marketDataService.getMarketOverview();`.
    *   Return `NextResponse.json(overview);`.
    *   Add error handling.
    *   Add `export const dynamic = 'auto';`.

**Step 4: Clean up `lib/services/mongoDbCacheService.ts`**

*   **File:** `lib/services/cacheServices/mongoDbCacheService.ts`
*   **Action:** Delete
*   **Description:** This service is no longer needed as the generic caching logic in `lib/cache.ts` is now used by `SecureMarketDataService` on the server side.

**Step 5: Review and confirm server-side service usage**

*   **Files:** `lib/services/marketDataService.js`, `lib/services/secureMarketDataService.ts`, `lib/cache.ts`, `lib/db/mongodb.ts`
*   **Action:** Review
*   **Description:** Ensure that `lib/cache.ts` and `lib/db/mongodb.ts` are only imported and used within `lib/services/secureMarketDataService.ts` or other explicitly server-side files (like API routes or backend files). Confirm that `SecureMarketDataService` is correctly used by `marketDataService`.