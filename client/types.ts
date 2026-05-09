/**
 * A QUiCK API entitás-típusai. A type-okat a QUiCK OpenAPI specifikációból
 * tükröztük; egyes mezők szándékosan opcionálisak, mert az API nem garantálja
 * mindenhol jelenlétüket. Az `unknown` mezők előfordulhatnak, ha az API
 * az eddig dokumentált sémához képest extra adatot ad — ezeket a hívó
 * tolerálja.
 */

export type IsoDate = string;
export type IsoDateTime = string;
export type DecimalString = string;

export type PaymentMethod = 'transfer' | 'cash' | 'card' | 'cod';
export type VatArea = 'HU' | 'EU' | '3RD';
export type PaidStatus = 1 | 2 | 3;

export type DateField =
  | 'due_at'
  | 'fulfilled_at'
  | 'issued_at'
  | 'created_at'
  | 'accounting_period'
  | 'financial_fulfillment'
  | 'exported_at'
  | 'vat_period';

/** Paginált response shape. */
export interface PaginatedList<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Bulk akciók (approve / unapprove / check / uncheck / export) válasza. */
export interface BulkResult {
  success_ids: number[];
  failed_ids: number[];
  errors: Array<{ id: number; errors: string[] }>;
}

/** Karantén-elfogadás válasz. */
export interface QuarantineAcceptResult {
  success_ids: number[];
  success_count: number;
  failure_count: number;
}

// ---------- Resource entitások ----------

export interface Expense {
  id: number;
  partner?: number | { id: number; name: string };
  partner_name?: string;
  invoice_number?: string;
  fulfilled_at?: IsoDate;
  due_at?: IsoDate;
  paid_status?: PaidStatus;
  payment_method?: PaymentMethod | null;
  vat_area?: VatArea | null;
  currency?: number | { id: number; name: string };
  has_artifact?: boolean;
  filing_number?: string;
  accounting_status?: string;
  excluded_from_accounting?: boolean;
  incomplete?: boolean;
  tags?: number[];
  simple_tags?: number[];
  assignments?: ExpenseAssignment[];
  [extra: string]: unknown;
}

/** Alias az `Expense`-re — detail-szintű mezők ugyanazon shape. */
export type ExpenseDetail = Expense;

export interface ExpenseAssignment {
  id: number;
  expense_type?: number | { id: number; name: string };
  vat?: number | { id: number; name: string; percent: number };
  net_amount?: DecimalString;
  vat_amount?: DecimalString;
  gross_amount?: DecimalString;
  tags: Array<number | { id: number; name: string }>;
}

export interface Income {
  id: number;
  partner?: number | { id: number; name: string };
  partner_name?: string | null;
  invoice_number?: string | null;
  fulfilled_at?: IsoDate | null;
  due_at?: IsoDate | null;
  paid_status?: PaidStatus;
  payment_method?: PaymentMethod | null;
  net_amount?: DecimalString | null;
  gross_amount?: DecimalString | null;
  vat_amount?: DecimalString | null;
  currency?: number | { id: number; name: string };
  is_cancelled?: boolean;
  invoice_type?: 0 | 1 | 2 | 3 | 4;
  [extra: string]: unknown;
}

export interface Partner {
  id: number;
  name: string;
  account_number?: string | null;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  tax_number?: string | null;
  is_customer?: boolean | null;
  is_vendor: boolean;
}

export interface PaidThrough {
  id: number;
  name: string;
  account_number?: string;
}

export interface Payment {
  id: number;
  date: IsoDate;
  account?: number;
  transactions: Array<{
    id: number;
    expense_id: number;
    amount: DecimalString;
    partner: string;
    currency: string;
    invoice_number: string;
    exchange_rate: DecimalString;
  }>;
}

export interface PulseAccount {
  id: number;
  name: string;
  account_number: string;
  currency: string;
  current_balance: DecimalString;
  last_updated: IsoDateTime;
}

export interface PulseSnapshot {
  summary: number;
  accounts: PulseAccount[];
}

export interface DocumentSummary {
  id: number;
  created_at: IsoDateTime;
  title?: string | null;
  filename?: string | null;
  simple_tag_ids: number[];
  document_type_name: string;
  link?: string | null;
}

export interface DocumentDetail {
  id: number;
  title: string | null;
  summary: string | null;
  document_type_id: number | null;
  keywords: string[];
  simple_tag_ids: number[];
  sender: string | null;
  recipient: string | null;
  contains_payable: boolean | null;
}

export interface DocumentType {
  id: number;
  name: string;
}

export interface DocumentFile {
  id: number;
  url: string;
}

export interface LedgerNumber {
  id: number;
  code?: string;
  name?: string;
}

export interface VatCategory {
  id: number;
  name?: string;
  code?: string;
  percent?: number;
  vat_area?: string;
  country?: string;
}

export interface TaxCode {
  name: string;
  code: string;
  account_number?: string;
}

export interface TaxMonth {
  month?: IsoDate;
  amount?: DecimalString;
  paid_status?: string;
  taxes?: TaxLine[];
}

export interface TaxLine {
  id: number;
  title: IsoDate;
  name: string;
  currency: string;
  exchange_rate: DecimalString;
  code: string;
  amount: DecimalString;
  due_at: IsoDate;
  paid_status: string;
  tags: number[];
  simple_tags: number[];
  external_id?: string;
}

export interface SalaryMonth {
  month?: IsoDate;
  amount?: DecimalString;
  paid_status?: string;
  due_at?: IsoDate;
  salaries?: SalaryLine[];
}

export interface SalaryLine {
  id: number;
  title: IsoDate;
  name: string;
  currency: string;
  exchange_rate: DecimalString;
  amount: DecimalString;
  paid_status: string;
  tags: number[];
  simple_tags: number[];
  external_id?: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  tax_account_number: string;
  expense_email: string;
  document_email: string;
  default_currency_name: string;
  advanced_accounting: boolean;
  enable_accounting_id: boolean;
  enable_vat_period: boolean;
}

export interface ArtifactUrl {
  url?: string;
  expense_id?: number;
  income_id?: number;
}

// ---------- Request param típusok ----------

export interface ListParams {
  /** Lapozási méret, default 100. */
  page_size?: number;
  /** A `paginate()` és `iterate()` automatikusan kezeli — manuálisan ne állítsd. */
  page?: number;
}

export interface ExpenseListParams extends ListParams {
  date_field?: DateField;
  from_date?: IsoDate;
  to_date?: IsoDate;
  ids?: number[];
  search?: string;
  ordering?: string;
  is_approved?: boolean | null;
  is_paid?: boolean | null;
  is_expired?: boolean | null;
  is_excluded_from_accounting?: boolean | null;
  is_new?: boolean | null;
  is_updated?: boolean | null;
  is_filed?: boolean | null;
  is_nav?: boolean | null;
  has_artifact?: boolean | null;
  has_attachment?: boolean | null;
  payment_method?: PaymentMethod[];
  vat_area?: VatArea[];
  with_tag_ids?: number[];
  with_expense_type_ids?: number[];
  without_tag_ids?: number[];
  without_expense_type_ids?: number[];
  gross_amount_min?: DecimalString;
  gross_amount_max?: DecimalString;
  currency_id?: number;
  [k: string]: unknown;
}

export interface IncomeListParams extends ListParams {
  from_date?: IsoDate;
  to_date?: IsoDate;
  due_at?: IsoDate;
  invoice_number?: string;
  partner?: string;
  payment_method?: string;
  is_due_soon?: boolean;
  is_expired?: boolean;
  paid_status?: PaidStatus[];
  revenue_types?: string[];
  tags?: string[];
  ordering?: string;
  [k: string]: unknown;
}

export interface PartnerListParams extends ListParams {
  name?: string;
}

export interface PaidThroughListParams extends ListParams {
  name?: string;
}

export interface PaymentListParams {
  date?: IsoDate;
  from_date?: IsoDate;
  to_date?: IsoDate;
}

export interface DocumentListParams extends ListParams {
  from_date?: IsoDate;
  to_date?: IsoDate;
  search?: string;
  ids?: number[];
  with_tag_ids?: number[];
  with_document_type_ids?: number[];
  is_new?: boolean | null;
  is_updated?: boolean | null;
  is_filed?: boolean | null;
  is_attached?: boolean | null;
  contains_payable?: boolean | null;
  ordering?: string;
  [k: string]: unknown;
}

export interface MonthlyListParams {
  from_date?: IsoDate;
  to_date?: IsoDate;
  fields?: string[];
}

export interface FileInput {
  filename: string;
  content: string;
}

export interface DocumentInput extends FileInput {
  title?: string;
  summary?: string;
  document_type_id?: number;
  keywords?: string[];
  simple_tag_ids?: number[];
  sender?: string;
  recipient?: string;
  contains_payable?: boolean;
}

export interface DocumentUpdate {
  title?: string;
  summary?: string;
  document_type_id?: number;
  keywords?: string[];
  simple_tag_ids?: number[];
  sender?: string;
  recipient?: string;
  contains_payable?: boolean;
}

export interface ExpenseUpdate {
  accounting_id?: string | null;
  vat_period_type?: 'monthly' | 'quarterly' | 'yearly' | null;
  vat_period_started_at?: IsoDate | null;
}

export interface SalaryCreate {
  title: IsoDate;
  amount: number;
  name: string;
  due_at?: IsoDate;
  currency?: string;
  account_number?: string;
  external_id?: string;
}

export interface SalaryUpdate {
  id: number;
  title?: IsoDate;
  name?: string;
  amount: DecimalString | number;
  account_number?: string;
  external_id?: string;
}

export interface TaxCreate {
  due_at: IsoDate;
  amount: number;
  title?: IsoDate;
  code?: string;
  name?: string;
  currency?: string;
  account_number?: string;
  external_id?: string;
}

export interface TaxUpdate {
  id: number;
  title?: IsoDate;
  due_at?: IsoDate;
  amount?: number;
  code?: string;
  name?: string;
  account_number?: string;
  external_id?: string;
}

export interface LedgerNumberCreate {
  code?: string;
  name?: string;
}

export interface LedgerNumberUpdate {
  code?: string;
  name?: string;
}

export interface VatCategoryCreate {
  percent: number;
  vat_area: VatArea;
  code?: string;
  name?: string;
  country?: string;
}

export interface VatCategoryUpdate {
  code?: string;
  name?: string;
  percent?: number;
  vat_area?: VatArea;
  country?: string;
}

export interface CompanyInfoUpdate {
  name?: string;
  tax_account_number?: string;
  default_currency_name?: string;
  advanced_accounting?: boolean;
  enable_accounting_id?: boolean;
  enable_vat_period?: boolean;
}

export interface ArtifactSearchParams {
  name: string;
  size: number;
  company_ids: number[];
}

export interface AttachDetachParams {
  ids: number[];
  target_type: 'expense' | 'income' | 'partner';
  target_id: number;
}
