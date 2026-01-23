# Order Simulation System

## Co to jest?

To system symulujacy przetwarzanie zamowien w architekturze opartej na kolejkach Azure Service Bus. Calosc dziala jak
demo/projekt edukacyjny pokazujacy, jak zamowienia przechodzą przez rozne etapy: od utworzenia, przez przygotowanie
i wysylke, az do wystawienia faktury. Wszystko z autentykacja przez Clerk i dashboardem do monitorowania.

## Jak to dziala

### Struktura kodu

Projekt uzywa Next.js 16 z App Routerem. Glowne foldery:

- `src/app/` - strony i API routes
- `src/components/` - komponenty React (formularze, tabele, panele)
- `src/lib/` - logika biznesowa i integracje z Azure
- `src/lib/azure/` - klienci Service Bus i Table Storage

Kluczowe pliki:

- `src/lib/azure/service-bus.ts` - cala komunikacja z kolejkami Azure (wysylanie/odbieranie wiadomosci)
- `src/lib/azure/table-storage.ts` - logowanie zdarzen do Azure Table Storage
- `src/lib/azure/mock-storage.ts` - mockowe implementacje do developmentu bez Azure
- `src/lib/utils.ts` - generowanie losowych zamowien i helperowe funkcje
- `src/lib/types.ts` - typy TypeScript dla zamowien, zdarzen i API
- `src/middleware.ts` - autentykacja Clerk z walidacja domeny emailowej

API Routes obslugujace caly pipeline:

- `src/app/api/orders/generate/route.ts` - tworzenie nowych zamowien
- `src/app/api/workers/prepare/route.ts` - worker przygotowujacy zamowienia
- `src/app/api/workers/ship/route.ts` - worker wysylkowy
- `src/app/api/workers/invoice/route.ts` - worker fakturujacy
- `src/app/api/logs/route.ts` - odczyt i zapis zdarzen

### Glowny flow

System dziala w 4 etapach, kazdy obslugiwany przez osobny "worker":

**1. Generowanie zamowienia**

Uzytkownik klika "Generuj" na stronie `/generator`. Frontend wywoluje POST do `/api/orders/generate`.
W `src/app/api/orders/generate/route.ts:9` tworzone jest losowe zamowienie funkcja `generateRandomOrder()`.
Zamowienie jest wysylane do kolejki `orders-queue` w `src/app/api/orders/generate/route.ts:11` i logowane jako
zdarzenie `OrderCreated` w `src/app/api/orders/generate/route.ts:13-18`.

**2. Przygotowanie zamowienia**

Worker "Prepare" pobiera zamowienie z kolejki `orders-queue`. W `src/app/api/workers/prepare/route.ts:18` wywolywane
jest `receiveFromQueue(QUEUE_NAMES.ORDERS)`. Jesli jest wiadomosc, worker symuluje prace (losowe opoznienie 2-5s
w `src/app/api/workers/prepare/route.ts:34-37`), zmienia status na `prepared` i wysyla zamowienie do kolejki
`prepared-orders-queue` w `src/app/api/workers/prepare/route.ts:44`. Na koniec loguje zdarzenie `OrderPrepared`.

**3. Wysylka**

Worker "Ship" dziala analogicznie - odbiera z `prepared-orders-queue` w `src/app/api/workers/ship/route.ts:18`,
symuluje pakowanie i wysylke, zmienia status na `shipped` i przekazuje do `shipped-orders-queue`
w `src/app/api/workers/ship/route.ts:44`. Loguje `OrderShipped`.

**4. Fakturowanie**

Ostatni worker odbiera z `shipped-orders-queue` w `src/app/api/workers/invoice/route.ts:18`. Tu nie ma juz nastepnej
kolejki - worker po prostu "wystawia fakture" (symulacja) i loguje `InvoiceSent` w
`src/app/api/workers/invoice/route.ts:39-44`. To koniec cyklu zycia zamowienia.

**Dashboard i monitoring**

Strona glowna (`src/app/page.tsx`) wyswietla wszystkie zdarzenia z Azure Table Storage. Dane pobierane sa z
`/api/logs` w `src/app/page.tsx:34`. Dashboard ma auto-refresh (co 1-10s do wyboru), filtry po ID zamowienia,
typie zdarzenia i serwisie. Statystyki kolejek (ile wiadomosci czeka) pokazuje komponent `StatsPanel`.

**Autentykacja**

Middleware w `src/middleware.ts:11-44` sprawdza czy uzytkownik jest zalogowany przez Clerk. Dodatkowo waliduje
domene emailowa - tylko adresy z `akademiabialska.pl` lub `stud.akademiabialska.pl` maja dostep
(konfigurowalny przez env `ALLOWED_DOMAINS`).

**Mock vs Azure**

System automatycznie wykrywa czy sa poprawne connection stringi do Azure. Jezeli nie - uzywa mockowych
implementacji w pamieci (`src/lib/azure/mock-storage.ts`). Mozna tez wymusic mock przez `USE_MOCK_STORAGE=true`.
Decyzja zapada w `src/lib/azure/service-bus.ts:16` i `src/lib/azure/table-storage.ts:14`.

## Setup

```bash
git clone <repo-url>
cd order-simulation-system
npm install
cp .env.example .env.local  # uzupelnij CLERK keys i opcjonalnie Azure connection stringi
npm run dev
```

## Testowanie

```bash
npm run lint
npm run build
```

## Tech Stack

- Next.js 16 (App Router, React 19)
- TypeScript
- Tailwind CSS 4
- Azure Service Bus (kolejki wiadomosci)
- Azure Table Storage (logowanie zdarzen)
- Clerk (autentykacja)
- uuid (generowanie ID)
