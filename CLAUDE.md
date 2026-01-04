# Zerro - Project Memory

## Overview

**Zerro** (https://zerro.app/) - неофициальный клиент ZenMoney с функциями envelope-бюджетирования (стиль YNAB). Позволяет синхронизировать данные с ZenMoney и управлять бюджетами через систему "конвертов".

**Версия:** 1.9.0

## Tech Stack

- **Frontend:** React 18 + TypeScript 5.8
- **State:** Redux Toolkit 2.6
- **UI:** Material-UI (MUI) 7 + Emotion
- **Build:** Vite 7
- **Routing:** React Router v5
- **i18n:** i18next 25
- **Тесты:** Vitest + Testing Library
- **PWA:** Workbox (Service Worker)
- **Web Workers:** Comlink для фоновой синхронизации
- **Storage:** IndexedDB (idb), localStorage
- **Package Manager:** pnpm

## Architecture (Feature-Sliced Design)

```
src/
├── 1-app/          # Bootstrap, routing, providers, error boundaries
├── 2-pages/        # Страницы (Auth, Transactions, Budgets, Accounts, Stats, Review, About)
├── 3-widgets/      # Переиспользуемые виджеты (Navigation, TransactionList, EnvelopeTable)
├── 4-features/     # Бизнес-логика (authorization, sync, bulkActions, export, envelope ops)
├── 5-entities/     # Модели данных (account, transaction, tag, budget, envelope, goal, currency)
├── 6-shared/       # Утилиты, UI-компоненты, API-клиенты, хелперы, локализация
├── store/          # Redux store (data, token, isPending, lastSync, displayCurrency)
├── worker/         # Web Worker для sync и data conversion
└── demoData/       # Генерация демо-данных
```

## Key Patterns

### Entity Model Pattern
Каждая сущность в `5-entities/` экспортирует `model` объект:
```typescript
export const accountModel = {
  selectors: { getAccount, getAccounts, ... },
  hooks: { useAccount, useAccounts, ... },
  thunks: { setAccount, deleteAccount, ... }
}
```

### Data Store Structure
```typescript
store.data = {
  current: TDataStore,    // Текущее состояние
  server: TDataStore,     // Последнее синхронизированное
  diff: TDiff             // Локальные изменения (не синхронизированы)
}
```

### Sync Flow
1. `syncData()` thunk -> 2. Get local diff -> 3. Send to Web Worker -> 4. Worker calls ZenMoney API -> 5. Convert response -> 6. `applyServerPatch()` -> 7. Save to IndexedDB

## Data Domains

```typescript
TDataStore {
  serverTimestamp, instrument, country, company, user, merchant,
  account, tag, budget, reminder, reminderMarker, transaction
}
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (localhost:3000)
pnpm build            # Production build
pnpm test             # Run tests
pnpm lint             # TypeScript check
pnpm lint:js          # ESLint
pnpm lint:css         # Stylelint
pnpm format           # Prettier
```

## Environment Variables

- `REACT_APP_CONSUMER_KEY` - ZenMoney OAuth client ID
- `REACT_APP_CONSUMER_SECRET` - ZenMoney OAuth client secret
- `REACT_APP_REDIRECT_URI` - OAuth redirect URI

Файлы: `.env.development`, `.env.production`

## API Integration

**ZenMoney API:**
- Auth: `https://api.zenmoney.{ru|app}/oauth2/authorize/`
- Token: `https://api.zenmoney.{ru|app}/oauth2/token/`
- Diff: `https://api.zenmoney.{ru|app}/v8/diff/`

Два региона: `.ru` и `.app`

## Key Files

| File | Purpose |
|------|---------|
| `src/1-app/App.tsx` | Main routing и layout |
| `src/1-app/Providers.tsx` | Redux, Theme, i18n providers |
| `src/store/index.ts` | Redux store configuration |
| `src/store/data/index.ts` | Main data slice (sync/patch logic) |
| `src/worker/index.ts` | Web Worker entry point |
| `src/6-shared/api/zenmoney/` | ZenMoney API client |
| `src/4-features/sync.ts` | Sync thunk |
| `src/4-features/authorization.ts` | Login/logout logic |

## Entities Quick Reference

| Entity | Location | Description |
|--------|----------|-------------|
| `envelope` | `5-entities/envelope/` | YNAB-style budget envelopes |
| `goal` | `5-entities/goal/` | Savings goals |
| `transaction` | `5-entities/transaction/` | Financial transactions |
| `budget` | `5-entities/budget/` | Budget allocations |
| `account` | `5-entities/account/` | Bank accounts |
| `tag` | `5-entities/tag/` | Transaction categories |
| `envBalances` | `5-entities/envBalances/` | Envelope balance calculations |
| `currency` | `5-entities/currency/` | Currencies and FX rates |

## Features Quick Reference

| Feature | Location | Description |
|---------|----------|-------------|
| `authorization` | `4-features/authorization.ts` | Login, logout, demo data |
| `sync` | `4-features/sync.ts` | Data synchronization |
| `bulkActions` | `4-features/bulkActions/` | fillGoals, fixOverspend, copyPrevMonth |
| `envelope` | `4-features/envelope/` | Create, patch, move envelopes |
| `export` | `4-features/export/` | JSON/CSV export |
| `moveMoney` | `4-features/moveMoney.ts` | Transfer between accounts |

## Debug Console

В production доступен через `window.zerro`:
```javascript
zerro.state              // Current Redux state
zerro.resetData()        // Clear all data
zerro.applyClientPatch() // Apply diff manually
zerro.toggleLogs()       // Enable logging
```

## Performance Notes

- **Virtualization:** react-window для длинных списков
- **Memoization:** createSelector для селекторов
- **Web Workers:** Тяжёлые операции в фоновом потоке
- **Code Splitting:** Lazy loading для About, Donation, Token, Stats, Review
- **Service Worker:** Кеширование ассетов, offline mode

## Localization

- Основной язык: Russian
- Fallback: English
- Namespace-based (transactions, budgets, loadingHints)
- Даты через date-fns с custom locales

## Important Considerations

1. **Envelope vs Tag budgets:** Zerro использует свою систему envelope budgets поверх ZenMoney tag budgets
2. **Multi-currency:** Поддержка нескольких валют с конвертацией через FX rates
3. **Offline-first:** PWA с полной поддержкой offline через IndexedDB
4. **Diff-based sync:** Только изменения отправляются на сервер
