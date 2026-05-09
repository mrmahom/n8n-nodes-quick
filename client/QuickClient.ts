import type { Transport } from './transport';
import { createFetchTransport, createN8nTransport, type FetchTransportOptions } from './transport';
import { AccountsResource } from './resources/accounts';
import { ArtifactsResource } from './resources/artifacts';
import { AuditXmlResource } from './resources/audit-xml';
import { CompanyResource } from './resources/company';
import { DocumentsResource } from './resources/documents';
import { DocumentTypesResource } from './resources/document-types';
import { ExpensesResource } from './resources/expenses';
import { IncomesResource } from './resources/incomes';
import { LedgerNumbersResource } from './resources/ledger-numbers';
import { PartnersResource } from './resources/partners';
import { PaymentsResource } from './resources/payments';
import { PulseResource } from './resources/pulse';
import { SalariesResource } from './resources/salaries';
import { TaxCodesResource } from './resources/tax-codes';
import { TaxesResource } from './resources/taxes';
import { VatCategoriesResource } from './resources/vat-categories';

export type QuickClientOptions = FetchTransportOptions;

/**
 * A QUiCK API kliens. Resource-onkénti namespace-ekkel rendezett — Stripe és
 * Octokit-stílusú API.
 *
 * @example Token-alapú használat (Node 18+, Bun, Deno, Workers)
 * ```ts
 * import { QuickClient } from 'n8n-nodes-quick';
 *
 * const quick = new QuickClient({ apiToken: process.env.QUICK_TOKEN! });
 *
 * const expenses = await quick.expenses.list({ is_paid: false });
 *
 * for await (const e of quick.expenses.iterate({ from_date: '2026-01-01' })) {
 *   console.log(e.partner_name);
 * }
 *
 * await quick.expenses.approve([1, 2, 3]);
 * ```
 *
 * @example n8n integráció (a node.ts-ből)
 * ```ts
 * const quick = QuickClient.fromN8n(this);
 * const data = await quick.expenses.get(42);
 * ```
 */
export class QuickClient {
  readonly accounts: AccountsResource;
  readonly artifacts: ArtifactsResource;
  readonly auditXml: AuditXmlResource;
  readonly company: CompanyResource;
  readonly documents: DocumentsResource;
  readonly documentTypes: DocumentTypesResource;
  readonly expenses: ExpensesResource;
  readonly incomes: IncomesResource;
  readonly ledgerNumbers: LedgerNumbersResource;
  readonly partners: PartnersResource;
  readonly payments: PaymentsResource;
  readonly pulse: PulseResource;
  readonly salaries: SalariesResource;
  readonly taxCodes: TaxCodesResource;
  readonly taxes: TaxesResource;
  readonly vatCategories: VatCategoriesResource;

  /** A használt transport — egyedi/teszt céllal felhasználható. */
  readonly transport: Transport;

  constructor(optionsOrTransport: QuickClientOptions | Transport) {
    this.transport = isTransport(optionsOrTransport)
      ? optionsOrTransport
      : createFetchTransport(optionsOrTransport);

    this.accounts = new AccountsResource(this.transport);
    this.artifacts = new ArtifactsResource(this.transport);
    this.auditXml = new AuditXmlResource(this.transport);
    this.company = new CompanyResource(this.transport);
    this.documents = new DocumentsResource(this.transport);
    this.documentTypes = new DocumentTypesResource(this.transport);
    this.expenses = new ExpensesResource(this.transport);
    this.incomes = new IncomesResource(this.transport);
    this.ledgerNumbers = new LedgerNumbersResource(this.transport);
    this.partners = new PartnersResource(this.transport);
    this.payments = new PaymentsResource(this.transport);
    this.pulse = new PulseResource(this.transport);
    this.salaries = new SalariesResource(this.transport);
    this.taxCodes = new TaxCodesResource(this.transport);
    this.taxes = new TaxesResource(this.transport);
    this.vatCategories = new VatCategoriesResource(this.transport);
  }

  /**
   * Factory az n8n {@link IExecuteFunctions} / {@link ILoadOptionsFunctions} /
   * {@link IPollFunctions} kontextusból. A QUiCK credential-t (`quickApi`)
   * automatikusan használja.
   */
  static fromN8n(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    options: { baseUrl?: string; companyId?: string } = {},
  ): QuickClient {
    return new QuickClient(createN8nTransport(context, options));
  }
}

function isTransport(x: unknown): x is Transport {
  return (
    typeof x === 'object' &&
    x !== null &&
    typeof (x as Transport).request === 'function' &&
    typeof (x as Transport).paginate === 'function'
  );
}
