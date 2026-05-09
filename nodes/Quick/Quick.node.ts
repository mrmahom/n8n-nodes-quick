import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchResult,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { QuickClient } from '../../client/QuickClient';
import type {
  AttachDetachParams,
  CompanyInfoUpdate,
  DocumentInput,
  DocumentListParams,
  DocumentUpdate,
  ExpenseListParams,
  ExpenseUpdate,
  IncomeListParams,
  LedgerNumberCreate,
  LedgerNumberUpdate,
  MonthlyListParams,
  PaidThroughListParams,
  PartnerListParams,
  PaymentListParams,
  SalaryCreate,
  SalaryUpdate,
  TaxCreate,
  TaxUpdate,
  VatCategoryCreate,
  VatCategoryUpdate,
} from '../../client/types';
import {
  addOptionalQueryParams,
  getQuickClient,
  parseIdList,
  stripEmpty,
  unwrapListResponse,
} from './utils';

import { accountFields, accountOperations } from './descriptions/AccountDescription';
import {
  ledgerNumberFields,
  ledgerNumberOperations,
  taxCodeFields,
  taxCodeOperations,
  vatCategoryFields,
  vatCategoryOperations,
} from './descriptions/AccountingDescription';
import {
  artifactFields,
  artifactOperations,
  auditXmlFields,
  auditXmlOperations,
  companyFields,
  companyOperations,
  documentTypeFields,
  documentTypeOperations,
} from './descriptions/CompanyDescription';
import { documentFields, documentOperations } from './descriptions/DocumentDescription';
import { expenseFields, expenseOperations } from './descriptions/ExpenseDescription';
import { incomeFields, incomeOperations } from './descriptions/IncomeDescription';
import { partnerFields, partnerOperations } from './descriptions/PartnerDescription';
import { paymentFields, paymentOperations } from './descriptions/PaymentDescription';
import { pulseFields, pulseOperations } from './descriptions/PulseDescription';
import { salaryFields, salaryOperations } from './descriptions/SalaryDescription';
import { taxFields, taxOperations } from './descriptions/TaxDescription';

export class Quick implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'QUiCK',
    name: 'quick',
    icon: 'file:quick.svg',
    group: ['transform'],
    version: [1],
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Interakció a QUiCK (helloquick.riport.app) számlázó- és könyvelőrendszer Public API-jával',
    defaults: { name: 'QUiCK' },
    usableAsTool: true,
    inputs: ['main'],
    // eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
    outputs: ['main', 'main'],
    outputNames: ['Output', 'Error'],
    credentials: [{ name: 'quickApi', required: true }],
    requestDefaults: {
      baseURL: '={{$credentials.baseUrl}}',
      headers: { Accept: 'application/json' },
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Account (Paid-Through)', value: 'account' },
          { name: 'Artifact', value: 'artifact' },
          { name: 'Audit XML', value: 'auditXml' },
          { name: 'Company', value: 'company' },
          { name: 'Document', value: 'document' },
          { name: 'Document Type', value: 'documentType' },
          { name: 'Expense', value: 'expense' },
          { name: 'Income', value: 'income' },
          { name: 'Ledger Number', value: 'ledgerNumber' },
          { name: 'Partner', value: 'partner' },
          { name: 'Payment', value: 'payment' },
          { name: 'Pulse', value: 'pulse' },
          { name: 'Salary', value: 'salary' },
          { name: 'Tax', value: 'tax' },
          { name: 'Tax Code', value: 'taxCode' },
          { name: 'VAT Category', value: 'vatCategory' },
        ],
        default: 'expense',
      },

      ...accountOperations,
      ...accountFields,
      ...artifactOperations,
      ...artifactFields,
      ...auditXmlOperations,
      ...auditXmlFields,
      ...companyOperations,
      ...companyFields,
      ...documentOperations,
      ...documentFields,
      ...documentTypeOperations,
      ...documentTypeFields,
      ...expenseOperations,
      ...expenseFields,
      ...incomeOperations,
      ...incomeFields,
      ...ledgerNumberOperations,
      ...ledgerNumberFields,
      ...partnerOperations,
      ...partnerFields,
      ...paymentOperations,
      ...paymentFields,
      ...pulseOperations,
      ...pulseFields,
      ...salaryOperations,
      ...salaryFields,
      ...taxOperations,
      ...taxFields,
      ...taxCodeOperations,
      ...taxCodeFields,
      ...vatCategoryOperations,
      ...vatCategoryFields,
    ],
  };

  methods = {
    loadOptions: {
      getPartners: loadPartners,
      getLedgerNumbers: loadLedgerNumbers,
      getVatCategories: loadVatCategories,
      getDocumentTypes: loadDocumentTypes,
      getAccounts: loadAccounts,
      getTaxCodes: loadTaxCodes,
    },
    listSearch: {
      searchExpenses,
      searchIncomes,
      searchDocuments,
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const errorData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[] | undefined;

        if (resource === 'expense') {
          responseData = await handleExpense.call(this, operation, i);
        } else if (resource === 'income') {
          responseData = await handleIncome.call(this, operation, i);
        } else if (resource === 'partner') {
          responseData = await handlePartner.call(this, operation, i);
        } else if (resource === 'account') {
          responseData = await handleAccount.call(this, operation, i);
        } else if (resource === 'payment') {
          responseData = await handlePayment.call(this, operation, i);
        } else if (resource === 'pulse') {
          responseData = await handlePulse.call(this, operation, i);
        } else if (resource === 'tax') {
          responseData = await handleTax.call(this, operation, i);
        } else if (resource === 'salary') {
          responseData = await handleSalary.call(this, operation, i);
        } else if (resource === 'taxCode') {
          responseData = await handleTaxCode.call(this, operation, i);
        } else if (resource === 'document') {
          responseData = await handleDocument.call(this, operation, i);
        } else if (resource === 'documentType') {
          responseData = await handleDocumentType.call(this, operation, i);
        } else if (resource === 'ledgerNumber') {
          responseData = await handleLedgerNumber.call(this, operation, i);
        } else if (resource === 'vatCategory') {
          responseData = await handleVatCategory.call(this, operation, i);
        } else if (resource === 'company') {
          responseData = await handleCompany.call(this, operation, i);
        } else if (resource === 'auditXml') {
          responseData = await handleAuditXml.call(this, operation, i);
        } else if (resource === 'artifact') {
          responseData = await handleArtifact.call(this, operation, i);
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData ?? {}),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          // A hibás item az "Error" output ágra kerül, nem szennyezi a happy path-t.
          const message = (error as Error).message ?? String(error);
          errorData.push({
            json: { ...items[i].json, error: message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData, errorData];
  }
}

// ---------- Resource handlers ----------

async function handleExpense(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);

  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const params: IDataObject = { ...filters };
    for (const key of ['ids', 'with_tag_ids', 'with_expense_type_ids']) {
      if (typeof params[key] === 'string') {
        const list = parseIdList(params[key] as string);
        if (list.length === 0) delete params[key];
        else params[key] = list;
      }
    }

    if (returnAll) {
      return (await client.expenses.paginate(params as ExpenseListParams)) as IDataObject[];
    }
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const response = await client.expenses.list({
      ...params,
      page: 1,
      page_size: limit,
    } as ExpenseListParams);
    return unwrapListResponse<IDataObject>(response) as IDataObject | IDataObject[];
  }

  if (operation === 'get') {
    const id = this.getNodeParameter('expenseId', i, undefined, { extractValue: true }) as string;
    return (await client.expenses.get(id)) as unknown as IDataObject;
  }

  if (operation === 'update') {
    const id = this.getNodeParameter('expenseId', i, undefined, { extractValue: true }) as string;
    const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
    return (await client.expenses.update(id, updateFields as ExpenseUpdate)) as unknown as IDataObject;
  }

  if (operation === 'create') {
    const file = await collectFileInput.call(this, i, 'expense.pdf');
    const source = this.getNodeParameter('source', i, 'public_api') as string;
    return (await client.expenses.create(file, source)) as unknown as IDataObject;
  }

  if (operation === 'searchArtifact') {
    const name = this.getNodeParameter('name', i) as string;
    const size = this.getNodeParameter('size', i) as number;
    const company_ids = parseIdList(this.getNodeParameter('company_ids', i) as string);
    return (await client.expenses.searchArtifact({
      name,
      size,
      company_ids,
    })) as IDataObject;
  }

  if (
    operation === 'approve' ||
    operation === 'unapprove' ||
    operation === 'check' ||
    operation === 'uncheck' ||
    operation === 'export'
  ) {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.expenses[operation](ids)) as unknown as IDataObject;
  }

  if (operation === 'quarantineAccept') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.expenses.quarantineAccept(ids)) as unknown as IDataObject;
  }

  throw new NodeOperationError(this.getNode(), `Unknown expense operation: ${operation}`);
}

async function handleIncome(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);

  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const params: IDataObject = { ...filters };

    for (const key of ['tags', 'revenue_types']) {
      if (typeof params[key] === 'string') {
        const arr = (params[key] as string).split(',').map((s) => s.trim()).filter(Boolean);
        if (arr.length === 0) delete params[key];
        else params[key] = arr;
      }
    }

    if (returnAll) {
      return (await client.incomes.paginate(params as IncomeListParams)) as IDataObject[];
    }
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const response = await client.incomes.list({
      ...params,
      page: 1,
      page_size: limit,
    } as IncomeListParams);
    return unwrapListResponse<IDataObject>(response) as IDataObject | IDataObject[];
  }

  if (operation === 'get') {
    const id = this.getNodeParameter('incomeId', i, undefined, { extractValue: true }) as string;
    return (await client.incomes.get(id)) as unknown as IDataObject;
  }

  throw new NodeOperationError(this.getNode(), `Unknown income operation: ${operation}`);
}

async function handlePartner(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as PartnerListParams;
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    if (returnAll) {
      return (await client.partners.paginate(filters)) as unknown as IDataObject[];
    }
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const response = await client.partners.list({ ...filters, page: 1, page_size: limit });
    return unwrapListResponse<IDataObject>(response) as IDataObject | IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown partner operation: ${operation}`);
}

async function handleAccount(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as PaidThroughListParams;
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    if (returnAll) {
      return (await client.accounts.paginate(filters)) as unknown as IDataObject[];
    }
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const response = await client.accounts.list({ ...filters, page: 1, page_size: limit });
    return unwrapListResponse<IDataObject>(response) as IDataObject | IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown account operation: ${operation}`);
}

async function handlePayment(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as PaymentListParams;
    return (await client.payments.list(filters)) as unknown as IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown payment operation: ${operation}`);
}

async function handlePulse(
  this: IExecuteFunctions,
  operation: string,
  _i: number,
): Promise<IDataObject> {
  const client = await getQuickClient(this);
  if (operation === 'get') {
    return (await client.pulse.get()) as unknown as IDataObject;
  }
  throw new NodeOperationError(this.getNode(), `Unknown pulse operation: ${operation}`);
}

async function handleTax(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);

  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const params: MonthlyListParams = {};
    addOptionalQueryParams(filters, ['from_date', 'to_date'], params as IDataObject);
    if (typeof filters.fields === 'string' && filters.fields.length > 0) {
      params.fields = (filters.fields as string).split(',').map((s) => s.trim()).filter(Boolean);
    }
    return (await client.taxes.list(params)) as unknown as IDataObject[];
  }

  if (operation === 'create') {
    const collection = this.getNodeParameter('taxes', i, {}) as IDataObject;
    const taxes = ((collection.tax as IDataObject[]) ?? []).map(stripEmpty) as unknown as TaxCreate[];
    return (await client.taxes.create(taxes)) as unknown as IDataObject[];
  }

  if (operation === 'update') {
    const collection = this.getNodeParameter('taxes', i, {}) as IDataObject;
    const taxes = ((collection.tax as IDataObject[]) ?? []).map(stripEmpty) as unknown as TaxUpdate[];
    return (await client.taxes.update(taxes)) as unknown as IDataObject[];
  }

  if (operation === 'delete') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.taxes.delete(ids)) as unknown as IDataObject;
  }

  throw new NodeOperationError(this.getNode(), `Unknown tax operation: ${operation}`);
}

async function handleSalary(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);

  if (operation === 'getAll') {
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const params: MonthlyListParams = {};
    addOptionalQueryParams(filters, ['from_date', 'to_date'], params as IDataObject);
    if (typeof filters.fields === 'string' && filters.fields.length > 0) {
      params.fields = (filters.fields as string).split(',').map((s) => s.trim()).filter(Boolean);
    }
    return (await client.salaries.list(params)) as unknown as IDataObject[];
  }

  if (operation === 'create') {
    const collection = this.getNodeParameter('salaries', i, {}) as IDataObject;
    const salaries = ((collection.salary as IDataObject[]) ?? []).map(
      stripEmpty,
    ) as unknown as SalaryCreate[];
    return (await client.salaries.create(salaries)) as unknown as IDataObject[];
  }

  if (operation === 'update') {
    const collection = this.getNodeParameter('salaries', i, {}) as IDataObject;
    const salaries = ((collection.salary as IDataObject[]) ?? []).map(
      stripEmpty,
    ) as unknown as SalaryUpdate[];
    return (await client.salaries.update(salaries)) as unknown as IDataObject[];
  }

  if (operation === 'delete') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.salaries.delete(ids)) as unknown as IDataObject;
  }

  throw new NodeOperationError(this.getNode(), `Unknown salary operation: ${operation}`);
}

async function handleTaxCode(
  this: IExecuteFunctions,
  operation: string,
  _i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    return (await client.taxCodes.list()) as unknown as IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown tax-code operation: ${operation}`);
}

async function handleDocument(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);

  if (operation === 'getAll' || operation === 'getFiles') {
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const params: IDataObject = { ...filters };
    for (const key of ['ids', 'with_tag_ids', 'with_document_type_ids']) {
      if (typeof params[key] === 'string') {
        const list = parseIdList(params[key] as string);
        if (list.length === 0) delete params[key];
        else params[key] = list;
      }
    }
    if (operation === 'getFiles') {
      return (await client.documents.listFiles(params as DocumentListParams)) as unknown as IDataObject[];
    }
    return (await client.documents.list(params as DocumentListParams)) as unknown as IDataObject[];
  }

  if (operation === 'get') {
    const id = this.getNodeParameter('documentId', i, undefined, { extractValue: true }) as string;
    return (await client.documents.get(id)) as unknown as IDataObject;
  }

  if (operation === 'create') {
    const source = this.getNodeParameter('source', i, 'public_api') as string;
    const collection = this.getNodeParameter('documents', i, {}) as IDataObject;
    const documents = ((collection.document as IDataObject[]) ?? []).map((doc) => {
      const cleaned = stripEmpty(doc);
      if (typeof cleaned.keywords === 'string') {
        cleaned.keywords = (cleaned.keywords as string)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (typeof cleaned.simple_tag_ids === 'string') {
        cleaned.simple_tag_ids = parseIdList(cleaned.simple_tag_ids as string);
      }
      return cleaned as unknown as DocumentInput;
    });
    return (await client.documents.createMany(documents, source)) as unknown as IDataObject;
  }

  if (operation === 'update') {
    const id = this.getNodeParameter('documentId', i, undefined, { extractValue: true }) as string;
    const updateFields = stripEmpty(
      this.getNodeParameter('updateFields', i, {}) as IDataObject,
    );
    if (typeof updateFields.keywords === 'string') {
      updateFields.keywords = (updateFields.keywords as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof updateFields.simple_tag_ids === 'string') {
      updateFields.simple_tag_ids = parseIdList(updateFields.simple_tag_ids as string);
    }
    return (await client.documents.update(
      id,
      updateFields as unknown as DocumentUpdate,
    )) as unknown as IDataObject;
  }

  if (operation === 'delete') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.documents.delete(ids)) as unknown as IDataObject;
  }

  if (operation === 'search') {
    const name = this.getNodeParameter('name', i) as string;
    const size = this.getNodeParameter('size', i) as number;
    const company_ids = parseIdList(this.getNodeParameter('company_ids', i) as string);
    return (await client.documents.search({ name, size, company_ids })) as IDataObject;
  }

  if (operation === 'attach' || operation === 'detach') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    const target_type = this.getNodeParameter('target_type', i) as AttachDetachParams['target_type'];
    const target_id = this.getNodeParameter('target_id', i) as number;
    const params: AttachDetachParams = { ids, target_type, target_id };
    await client.documents[operation](params);
    return { success: true, operation, ids, target_type, target_id };
  }

  throw new NodeOperationError(this.getNode(), `Unknown document operation: ${operation}`);
}

async function handleDocumentType(
  this: IExecuteFunctions,
  operation: string,
  _i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    return (await client.documentTypes.list()) as unknown as IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown document-type operation: ${operation}`);
}

async function handleLedgerNumber(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    return (await client.ledgerNumbers.list()) as unknown as IDataObject[];
  }
  if (operation === 'create') {
    const collection = this.getNodeParameter('ledger_numbers', i, {}) as IDataObject;
    const list = ((collection.item as IDataObject[]) ?? []).map(
      stripEmpty,
    ) as unknown as LedgerNumberCreate[];
    return (await client.ledgerNumbers.create(list)) as IDataObject;
  }
  if (operation === 'update') {
    const id = this.getNodeParameter('ledgerNumberId', i) as string;
    const updateFields = stripEmpty(
      this.getNodeParameter('updateFields', i, {}) as IDataObject,
    ) as unknown as LedgerNumberUpdate;
    return (await client.ledgerNumbers.update(id, updateFields)) as unknown as IDataObject;
  }
  if (operation === 'delete') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.ledgerNumbers.delete(ids)) as unknown as IDataObject;
  }
  throw new NodeOperationError(this.getNode(), `Unknown ledger-number operation: ${operation}`);
}

async function handleVatCategory(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getAll') {
    return (await client.vatCategories.list()) as unknown as IDataObject[];
  }
  if (operation === 'create') {
    const collection = this.getNodeParameter('vat_categories', i, {}) as IDataObject;
    const list = ((collection.item as IDataObject[]) ?? []).map(
      stripEmpty,
    ) as unknown as VatCategoryCreate[];
    return (await client.vatCategories.create(list)) as IDataObject;
  }
  if (operation === 'update') {
    const id = this.getNodeParameter('companyVatCategoryId', i) as string;
    const updateFields = stripEmpty(
      this.getNodeParameter('updateFields', i, {}) as IDataObject,
    ) as unknown as VatCategoryUpdate;
    return (await client.vatCategories.update(id, updateFields)) as unknown as IDataObject;
  }
  if (operation === 'delete') {
    const ids = parseIdList(this.getNodeParameter('ids', i) as string);
    return (await client.vatCategories.delete(ids)) as unknown as IDataObject;
  }
  throw new NodeOperationError(this.getNode(), `Unknown vat-category operation: ${operation}`);
}

async function handleCompany(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  if (operation === 'getInfo') {
    return (await client.company.getInfo()) as unknown as IDataObject;
  }
  if (operation === 'updateInfo') {
    const id = this.getNodeParameter('companyId', i) as string;
    const updateFields = stripEmpty(
      this.getNodeParameter('updateFields', i, {}) as IDataObject,
    ) as unknown as CompanyInfoUpdate;
    return (await client.company.updateInfo(id, updateFields)) as unknown as IDataObject;
  }
  throw new NodeOperationError(this.getNode(), `Unknown company operation: ${operation}`);
}

async function handleAuditXml(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject> {
  const client = await getQuickClient(this);
  if (operation === 'upload') {
    const file = await collectFileInput.call(this, i, 'audit.xml');
    return (await client.auditXml.upload(file)) as unknown as IDataObject;
  }
  throw new NodeOperationError(this.getNode(), `Unknown audit-xml operation: ${operation}`);
}

/**
 * Egységes fájl-bemenet kezelő: az `inputType` paraméter alapján vagy a
 * `content` mezőből (base64 string), vagy a bemeneti item binary mezőjéből
 * olvas. A fájlnevet a felhasználó által megadott `filename`-ből, ennek
 * hiányában a binary metaadatból (`fileName`) szedi, fallback-ként a megadott
 * defaultBól.
 */
async function collectFileInput(
  this: IExecuteFunctions,
  i: number,
  defaultFilename: string,
): Promise<{ filename: string; content: string }> {
  const inputType = this.getNodeParameter('inputType', i, 'base64') as string;
  const explicitFilename = this.getNodeParameter('filename', i, '') as string;

  if (inputType === 'binary') {
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
    const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
    const items = this.getInputData();
    const meta = items[i]?.binary?.[binaryPropertyName] as
      | { fileName?: string; mimeType?: string }
      | undefined;
    return {
      filename: explicitFilename || meta?.fileName || defaultFilename,
      content: buffer.toString('base64'),
    };
  }

  const content = this.getNodeParameter('content', i, '') as string;
  return { filename: explicitFilename || defaultFilename, content };
}

async function handleArtifact(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  const client = await getQuickClient(this);
  const ids = parseIdList(this.getNodeParameter('ids', i) as string);
  if (operation === 'getExpense') {
    return (await client.artifacts.forExpenses(ids)) as unknown as IDataObject[];
  }
  if (operation === 'getIncome') {
    return (await client.artifacts.forIncomes(ids)) as unknown as IDataObject[];
  }
  throw new NodeOperationError(this.getNode(), `Unknown artifact operation: ${operation}`);
}

// ---------- loadOptions / listSearch ----------

function toOption(name: string, value: string | number): INodePropertyOptions {
  return { name, value };
}

async function loadPartners(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const partners = await client.partners.paginate();
  return partners.map((p) => toOption(String(p.name ?? p.id), Number(p.id)));
}

async function loadLedgerNumbers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const list = await client.ledgerNumbers.list();
  return list.map((l) =>
    toOption(`${l.code ?? ''} ${l.name ?? ''}`.trim() || String(l.id), Number(l.id)),
  );
}

async function loadVatCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const list = await client.vatCategories.list();
  return list
    .filter((v) => v.id !== undefined)
    .map((v) => toOption(`${v.name ?? v.code ?? ''}` || String(v.id), Number(v.id)));
}

async function loadDocumentTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const list = await client.documentTypes.list();
  return list.map((d) => toOption(String(d.name ?? d.id), Number(d.id)));
}

async function loadAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const accounts = await client.accounts.paginate();
  return accounts.map((a) => toOption(String(a.name ?? a.id), Number(a.id)));
}

async function loadTaxCodes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const list = await client.taxCodes.list();
  return list.map((t) =>
    toOption(`${t.code ?? ''} ${t.name ?? ''}`.trim(), String(t.code ?? '')),
  );
}

/** Resource Locator "list" mode helper-ek a UI search-hez. */
async function searchExpenses(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const params: ExpenseListParams = { page: 1, page_size: 50 };
  if (filter) (params as IDataObject).search = filter;
  const response = await client.expenses.list(params);
  const items = unwrapListResponse<IDataObject>(response);
  const list = Array.isArray(items) ? items : [items];
  return {
    results: list.map((e) => ({
      name: `${e.invoice_number ?? '—'}  ·  ${e.partner_name ?? ''}  ·  ${e.gross_amount ?? ''}`.trim(),
      value: Number(e.id),
    })),
  };
}

async function searchIncomes(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const params: IncomeListParams = { page: 1, page_size: 50 };
  if (filter) (params as IDataObject).search = filter;
  const response = await client.incomes.list(params);
  const items = unwrapListResponse<IDataObject>(response);
  const list = Array.isArray(items) ? items : [items];
  return {
    results: list.map((e) => ({
      name: `${e.invoice_number ?? '—'}  ·  ${e.partner_name ?? ''}  ·  ${e.gross_amount ?? ''}`.trim(),
      value: Number(e.id),
    })),
  };
}

async function searchDocuments(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = (await this.getCredentials('quickApi')) as unknown as {
    baseUrl?: string;
    companyId?: string;
  };
  const client = QuickClient.fromN8n(this, credentials);
  const params: DocumentListParams = { page: 1, page_size: 50 };
  if (filter) params.search = filter;
  const list = await client.documents.list(params);
  const arr = Array.isArray(list) ? list : list ? [list] : [];
  return {
    results: (arr as unknown as IDataObject[]).map((d) => ({
      name: String(d.title ?? d.filename ?? d.id),
      value: Number(d.id),
    })),
  };
}


