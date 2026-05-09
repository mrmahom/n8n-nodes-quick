/**
 * Public npm API a `n8n-nodes-quick` csomaghoz.
 *
 * @example
 * ```ts
 * import { QuickClient, QuickApiError } from 'n8n-nodes-quick';
 *
 * const quick = new QuickClient({ apiToken: process.env.QUICK_TOKEN! });
 *
 * try {
 *   const expenses = await quick.expenses.list({ is_paid: false });
 * } catch (err) {
 *   if (err instanceof QuickApiError && err.isAuthError) {
 *     // ...
 *   }
 * }
 * ```
 */
export { QuickClient } from './client/QuickClient';
export type { QuickClientOptions } from './client/QuickClient';
export { QuickApiError } from './client/errors';
export {
  createFetchTransport,
  createN8nTransport,
  DEFAULT_BASE_URL,
  DEFAULT_PAGE_SIZE,
  PAGINATION_CONCURRENCY,
  PAGINATION_MAX_PAGES,
} from './client/transport';
export type {
  Transport,
  RequestOptions,
  HttpMethod,
  FetchTransportOptions,
} from './client/transport';

// Resource osztályok — csak típusként exportáljuk, a felhasználó nem direkt
// instantiálja, hanem a QuickClient-ből éri el (`client.expenses` stb.).
export type { ExpensesResource } from './client/resources/expenses';
export type { IncomesResource } from './client/resources/incomes';
export type { PartnersResource } from './client/resources/partners';
export type { AccountsResource } from './client/resources/accounts';
export type { PaymentsResource } from './client/resources/payments';
export type { PulseResource } from './client/resources/pulse';
export type { DocumentsResource } from './client/resources/documents';
export type { DocumentTypesResource } from './client/resources/document-types';
export type { TaxesResource } from './client/resources/taxes';
export type { TaxCodesResource } from './client/resources/tax-codes';
export type { SalariesResource } from './client/resources/salaries';
export type { LedgerNumbersResource } from './client/resources/ledger-numbers';
export type { VatCategoriesResource } from './client/resources/vat-categories';
export type { CompanyResource } from './client/resources/company';
export type { ArtifactsResource } from './client/resources/artifacts';
export type { AuditXmlResource } from './client/resources/audit-xml';

// Entitás-típusok és request param interfészek
export type {
  // common
  IsoDate,
  IsoDateTime,
  DecimalString,
  PaymentMethod,
  VatArea,
  PaidStatus,
  DateField,
  PaginatedList,
  BulkResult,
  QuarantineAcceptResult,
  // entities
  Expense,
  ExpenseDetail,
  ExpenseAssignment,
  Income,
  Partner,
  PaidThrough,
  Payment,
  PulseAccount,
  PulseSnapshot,
  DocumentSummary,
  DocumentDetail,
  DocumentType,
  DocumentFile,
  LedgerNumber,
  VatCategory,
  TaxCode,
  TaxMonth,
  TaxLine,
  SalaryMonth,
  SalaryLine,
  CompanyInfo,
  ArtifactUrl,
  // request params
  ListParams,
  ExpenseListParams,
  IncomeListParams,
  PartnerListParams,
  PaidThroughListParams,
  PaymentListParams,
  DocumentListParams,
  MonthlyListParams,
  FileInput,
  DocumentInput,
  DocumentUpdate,
  ExpenseUpdate,
  SalaryCreate,
  SalaryUpdate,
  TaxCreate,
  TaxUpdate,
  LedgerNumberCreate,
  LedgerNumberUpdate,
  VatCategoryCreate,
  VatCategoryUpdate,
  CompanyInfoUpdate,
  ArtifactSearchParams,
  AttachDetachParams,
} from './client/types';
