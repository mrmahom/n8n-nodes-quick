# n8n-nodes-quick

A [QUiCK](https://helloquick.riport.app) (helloquick.riport.app) számlázó- és könyvelőrendszer Public API-ja **dual-purpose npm csomagként**:

1. **n8n community node** + **trigger node** — n8n-workflow-ba dropolható integráció
2. **`QuickClient` API kliens** — framework-mentes, type-safe TypeScript kliens bárhol, ahol Node.js 20+ vagy modern JS runtime fut

**Szerző:** E. Martin Maho

**Highlight features:**
- ⚡ **Párhuzamos pagináció** (count-alapú, ~5x gyorsabb listázás)
- 🔁 **Auto-retry** 429 / 5xx-re exponenciális backoff-fal, `Retry-After` fejléccel
- 📦 **Auto-batch chunking** bulk akciókra (100/req) és create-re (5/req)
- 🤖 **`usableAsTool: true`** — AI Agent node automatikusan használhatja
- 🌳 **Két output ág** (Output / Error) `continueOnFail` esetén
- 🔍 **Resource Locator** + **loadOptions dropdown** ID mezőkre
- 📄 **Binary input bridge** számlakép és audit XML feltöltéshez
- 📚 **Workflow templates** a `templates/` mappában

## QuickClient API (npm import)

```ts
import { QuickClient, QuickApiError } from 'n8n-nodes-quick';

const quick = new QuickClient({ apiToken: process.env.QUICK_TOKEN! });

// Egyszeri lekérés
const expenses = await quick.expenses.list({ is_paid: false });

// Async iterátor — automatikus pagináció minden oldalon
for await (const expense of quick.expenses.iterate({ from_date: '2026-01-01' })) {
  console.log(expense.partner_name, expense.gross_amount);
}

// Részletek
const detail = await quick.expenses.get(42);

// Bulk akció — 100-as batch méretben automatikusan chunkolva
await quick.expenses.approve([1, 2, 3 /* …akár több ezer ID */]);

// Hibakezelés
try {
  await quick.expenses.get(999);
} catch (err) {
  if (err instanceof QuickApiError) {
    if (err.isNotFound) console.log('nincs ilyen kiadás');
    if (err.isAuthError) console.log('rossz token');
    if (err.isTransient) console.log('átmeneti hiba — később próbálkozz');
  }
}
```

**Resource namespace-ek:** `expenses`, `incomes`, `partners`, `accounts`, `payments`, `pulse`, `documents`, `documentTypes`, `taxes`, `taxCodes`, `salaries`, `ledgerNumbers`, `vatCategories`, `company`, `artifacts`, `auditXml` (16 darab — minden non-OAuth végpont).

**Egyedi transport** (proxy / custom auth / Workers env):

```ts
import { QuickClient, createFetchTransport } from 'n8n-nodes-quick';

const transport = createFetchTransport({
  apiToken: process.env.QUICK_TOKEN!,
  fetch: customFetch,            // pl. proxy-zolt fetch
  maxRetries: 5,
  defaultHeaders: { 'X-App': 'my-app' },
});
const quick = new QuickClient(transport);
```

## Telepítés

n8n-en belül **Settings → Community Nodes → Install** és add meg a csomag nevét: `n8n-nodes-quick`.

Helyi fejlesztéshez:

```bash
npm install
npm run build
# az n8n custom mappájába linkelés
mkdir -p ~/.n8n/custom
ln -s "$(pwd)" ~/.n8n/custom/n8n-nodes-quick
```

Indítsd újra az n8n-t, ezután a `QUiCK` node megjelenik a node listában.

## Hitelesítés

A node `Token` típusú authentikációt használ: `Authorization: Token <api_key>`. A QUiCK admin felületén kérhető API kulcs.

A credential űrlap mezői:

| Mező | Kötelező | Leírás |
|---|---|---|
| API Token | igen | A QUiCK admin felületén generált Public API token |
| Base URL | nem | Default: `https://api.quick.riport.co.hu` |
| Company ID | nem | Több cégnél a `Quick-Company-Id` fejléc értéke |

A credential teszt a `/2/company-info/` végponttal validál.

## Resource-ok és műveletek

| Resource | Műveletek | Mögöttes API |
|---|---|---|
| **Account** (paid-through) | Get Many | `/1/accounts/` |
| **Artifact** | Get Expense / Get Income Artifacts | `/1/artifacts/expense/`, `/1/artifacts/income/` |
| **Audit XML** | Upload | `/2/audit-xml/` |
| **Company** | Get Info, Update Info | `/2/company-info/`, `/2/company-info/update/{id}/` |
| **Document** | Get Many, Get, Get File URLs, Create, Update, Delete, Search, Attach, Detach | `/1/documents/`, `/1/documents/files/`, `/2/documents/...`, `/1/documents/attach\|detach/` |
| **Document Type** | Get Many | `/2/document-types/` |
| **Expense** | Get Many, Get, Create, Update, Approve, Unapprove, Check, Uncheck, Export, Quarantine Accept, Search Artifact | `/2/expenses/...` (lekérés/módosítás v2), `/1/expenses/approve\|...` (akciók) |
| **Income** | Get Many, Get | `/1/incomes/`, `/1/incomes/{id}/` |
| **Ledger Number** | Get Many, Create, Update, Delete | `/2/accounting/ledger-numbers/...` |
| **Partner** | Get Many | `/1/partners/` |
| **Payment** | Get Many | `/1/payments/` |
| **Pulse** | Get | `/1/pulse/` |
| **Salary** | Get Many, Create, Update, Delete | `/1/monthly-salaries/`, `/1/salaries/create\|update\|delete/` |
| **Tax** | Get Many, Create, Update, Delete | `/1/monthly-taxes/`, `/1/taxes/create\|update\|delete/` |
| **Tax Code** | Get Many | `/1/tax-codes/` |
| **VAT Category** | Get Many, Create, Update, Delete | `/2/accounting/vat-categories/...` |

## Lapozás

A `Get Many` műveletek a paginált végpontokon a `Return All` kapcsolóval automatikusan végiglapoznak (page=1..N), egyébként a megadott `Limit` értékkel egy oldalt kérnek le.

## ID listás mezők

A vesszővel elválasztott ID mezőket (`ids`, `with_tag_ids`, `simple_tag_ids`, …) a node automatikusan parsolja számtömbbé a request body / query előtt.

## Példa: utolsó 30 nap kiadásai

1. **Resource:** Expense
2. **Operation:** Get Many
3. **Return All:** true
4. **Filters:**
   - `date_field`: `fulfilled_at`
   - `from_date`: `={{ $today.minus({days:30}).toFormat('yyyy-MM-dd') }}`
   - `to_date`: `={{ $today.toFormat('yyyy-MM-dd') }}`

## Fejlesztés

```bash
npm install
npm run dev    # tsc --watch
npm run lint
npm run build  # tsc + ikon másolás dist/-be
```

## Tesztek

Háromrétegű tesztpiramis, jest + ts-jest alatt. **263 teszt, 100% statement / line / function coverage, 97% branch coverage** (a maradék 3% defenzív kód, pl. `?? String(error)` ami csak nem-Error throw esetén futna le — n8n-ben sosem). Threshold-ként rögzítve — a `npm run test:coverage` bármilyen regresszió esetén hibát dob. `npm run lint` zero error, `npm run build` zero error.

```bash
npm test                # egyszeri futtatás (jest)
npm run test:watch      # watch mód, fejlesztés közben
npm run test:coverage   # lcov + html report a coverage/ mappába
```

A három teszt-réteg:

```
tests/
├── credentials/                              # 1. statikus contract tesztek
│   └── QuickApi.credentials.test.ts
├── helpers/
│   └── mockExecuteFunctions.ts               # IExecuteFunctions factory
├── nodes/Quick/
│   ├── GenericFunctions.test.ts              # 2.a unit tesztek
│   ├── Quick.description.test.ts             # 2.b description integritás
│   ├── Quick.description.snapshot.test.ts    # 2.c sort-order + snapshot
│   ├── Quick.handlers.test.ts                # 2.d resource × operation lefedés
│   ├── Quick.node.test.ts                    # 2.e execute() core happy paths
│   └── Quick.execute.errors.test.ts          # 2.f hibaágak
└── integration/
    └── Quick.integration.test.ts             # 3. nock-os HTTP wire teszt
```

| Réteg | Mit fed le |
|---|---|
| **Credentials** | `apiToken` mezőkonvenció, `Token <api>` Authorization fejléc, `/2/company-info/` teszt-végpont, OAuth hivatkozás teljes hiánya |
| **GenericFunctions unit** | `parseIdList` 11 paraméterezett edge case (negatív, decimális, leading zero, csak vesszők), `stripEmpty` (NaN, üres tömb, mutáció-mentesség), `addOptionalQueryParams` (false boolean nem szűrődik), `quickApiRequest` (URL építés, trailing-slash kezelés, opcionális `Quick-Company-Id` fejléc, `Accept` default, üres body/qs eldobás, custom `option` override, PATCH/DELETE method, `NodeApiError` wrap), `quickApiRequestAllItems` (next-lánc, üres results, 500-as `maxPages` guard, custom pageSize, filter-megőrzés) |
| **Description integritás** | 16 resource, minden resource-hoz operation, OAuth-only resource teljes hiánya, `displayOptions.show.resource` validitás, nincs duplikált `name × resource × operation` kombináció |
| **Description sort + action** | n8n-nodes-base linting konvenciók: alphabetical resource opciók, alphabetical operation opciók resource-onként, minden operation-höz `action` mező, snapshot a resource×operation struktúráról |
| **Resource handler matrix** | Minden resource minden operation-jén minimum egy happy-path teszt: ID lista parsing, fixedCollection → array body, üres mező eldobás (`stripEmpty`), keywords/simple_tag_ids stringből listává, response shape (results / közvetlen array) |
| **Execute hibaágak** | Unknown resource, unknown operation minden resource-ra (`it.each` paraméterezve), üres `getInputData()`, `continueOnFail` szelektív hibakezelés (csak a hibás item kapja az error json-t), `NodeApiError` továbbpropagáció string üzenetté |
| **HTTP integráció (nock)** | Nock-kal interceptált valós fetch hívás: Token Authorization fejléc beszúrása, `Quick-Company-Id`, JSON body szerializálás, query string serializálás, paginációs next-lánc követése, 400/401/500 → értelmezhető hiba |

## Licenc

MIT
