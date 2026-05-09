import { INodeProperties } from 'n8n-workflow';

export const expenseOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['expense'] } },
    options: [
      {
        name: 'Approve',
        value: 'approve',
        action: 'Approve expenses',
        description: 'Kiadások jóváhagyása ID lista alapján',
      },
      {
        name: 'Check',
        value: 'check',
        action: 'Check expenses',
        description: 'Kiadások ellenőrzöttre állítása',
      },
      {
        name: 'Create',
        value: 'create',
        action: 'Create expense',
        description: 'Új kiadás (számlakép) feltöltése (v2)',
      },
      {
        name: 'Export',
        value: 'export',
        action: 'Export expenses',
        description: 'Kiadások exportált státuszba állítása',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get an expense',
        description: 'Egy kiadás részletes adatainak lekérése',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many expenses',
        description: 'Kiadások listázása szűrhetően',
      },
      {
        name: 'Quarantine Accept',
        value: 'quarantineAccept',
        action: 'Accept quarantined expenses',
        description: 'Karanténban lévő kiadások elfogadása',
      },
      {
        name: 'Search Artifact',
        value: 'searchArtifact',
        action: 'Search expense artifact',
        description: 'Megnézi, létezik-e már ilyen nevű és méretű számlakép',
      },
      {
        name: 'Unapprove',
        value: 'unapprove',
        action: 'Unapprove expenses',
        description: 'Kiadások jóváhagyásának visszavonása',
      },
      {
        name: 'Uncheck',
        value: 'uncheck',
        action: 'Uncheck expenses',
        description: 'Kiadások ellenőrzött státuszának visszavonása',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update an expense',
        description: 'Kiadás könyvelési adatainak frissítése (v2 PATCH)',
      },
    ],
    default: 'getAll',
  },
];

const expenseGetAllFields: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['expense'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: {
        resource: ['expense'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['expense'], operation: ['getAll'] } },
    options: [
      { displayName: 'Currency ID', name: 'currency_id', type: 'number', default: 0 },
      {
        displayName: 'Date Field',
        name: 'date_field',
        type: 'options',
        default: 'fulfilled_at',
        options: [
          { name: 'Accounting Period', value: 'accounting_period' },
          { name: 'Created At', value: 'created_at' },
          { name: 'Due At', value: 'due_at' },
          { name: 'Exported At', value: 'exported_at' },
          { name: 'Financial Fulfillment', value: 'financial_fulfillment' },
          { name: 'Fulfilled At', value: 'fulfilled_at' },
          { name: 'Issued At', value: 'issued_at' },
          { name: 'VAT Period', value: 'vat_period' },
        ],
        description: 'Mely dátumot szűrje a from_date / to_date',
      },
      {
        displayName: 'From Date',
        name: 'from_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      { displayName: 'Gross Amount Max', name: 'gross_amount_max', type: 'string', default: '' },
      { displayName: 'Gross Amount Min', name: 'gross_amount_min', type: 'string', default: '' },
      { displayName: 'Has Artifact', name: 'has_artifact', type: 'boolean', default: false },
      {
        displayName: 'IDs',
        name: 'ids',
        type: 'string',
        default: '',
        description: 'Csak ezekre a kiadás-azonosítókra szűrjön',
      },
      { displayName: 'Is Approved', name: 'is_approved', type: 'boolean', default: false },
      {
        displayName: 'Is Excluded From Accounting',
        name: 'is_excluded_from_accounting',
        type: 'boolean',
        default: false,
      },
      { displayName: 'Is Expired', name: 'is_expired', type: 'boolean', default: false },
      { displayName: 'Is Filed', name: 'is_filed', type: 'boolean', default: false },
      { displayName: 'Is New', name: 'is_new', type: 'boolean', default: false },
      { displayName: 'Is Paid', name: 'is_paid', type: 'boolean', default: false },
      { displayName: 'Is Updated', name: 'is_updated', type: 'boolean', default: false },
      {
        displayName: 'Ordering',
        name: 'ordering',
        type: 'string',
        default: '',
        description: 'Pl. -fulfilled_at, gross_amount, partner_name.',
      },
      {
        displayName: 'Payment Methods',
        name: 'payment_method',
        type: 'multiOptions',
        default: [],
        options: [
          { name: 'Card', value: 'card' },
          { name: 'Cash', value: 'cash' },
          { name: 'Cash On Delivery', value: 'cod' },
          { name: 'Transfer', value: 'transfer' },
        ],
      },
      { displayName: 'Search', name: 'search', type: 'string', default: '' },
      {
        displayName: 'To Date',
        name: 'to_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      {
        displayName: 'VAT Area',
        name: 'vat_area',
        type: 'multiOptions',
        default: [],
        options: [
          { name: 'EU', value: 'EU' },
          { name: 'Hungary', value: 'HU' },
          { name: 'Third Country', value: '3RD' },
        ],
      },
      {
        displayName: 'With Expense Type IDs',
        name: 'with_expense_type_ids',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott költségnem azonosítók',
      },
      {
        displayName: 'With Tag IDs',
        name: 'with_tag_ids',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott tag azonosítók',
      },
    ],
  },
];

const expenseGetFields: INodeProperties[] = [
  {
    displayName: 'Expense',
    name: 'expenseId',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'id', value: '' },
    description: 'A kiadás megadása ID-val, listából vagy URL-ből',
    displayOptions: { show: { resource: ['expense'], operation: ['get'] } },
    modes: [
      {
        displayName: 'ID',
        name: 'id',
        type: 'string',
        placeholder: 'pl. 12345',
        validation: [
          {
            type: 'regex',
            properties: {
              regex: '^[0-9]+$',
              errorMessage: 'Az ID csak számokat tartalmazhat',
            },
          },
        ],
      },
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchExpenses',
          searchable: true,
          searchFilterRequired: false,
        },
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        placeholder: 'https://quick.riport.co.hu/expenses/12345',
        extractValue: {
          type: 'regex',
          regex: '/expenses/(\\d+)',
        },
      },
    ],
  },
];

const expenseBulkIdFields: INodeProperties[] = [
  {
    displayName: 'Expense IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '101,102,103',
    description: 'Vesszővel elválasztott kiadás-azonosítók',
    displayOptions: {
      show: {
        resource: ['expense'],
        operation: ['approve', 'unapprove', 'check', 'uncheck', 'export', 'quarantineAccept'],
      },
    },
  },
];

const expenseUpdateFields: INodeProperties[] = [
  {
    displayName: 'Expense',
    name: 'expenseId',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'id', value: '' },
    displayOptions: { show: { resource: ['expense'], operation: ['update'] } },
    modes: [
      { displayName: 'ID', name: 'id', type: 'string', placeholder: 'pl. 12345' },
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchExpenses',
          searchable: true,
        },
      },
    ],
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['expense'], operation: ['update'] } },
    options: [
      {
        displayName: 'Accounting ID',
        name: 'accounting_id',
        type: 'string',
        default: '',
      },
      {
        displayName: 'VAT Period Type',
        name: 'vat_period_type',
        type: 'options',
        default: 'monthly',
        options: [
          { name: 'Monthly', value: 'monthly' },
          { name: 'Quarterly', value: 'quarterly' },
          { name: 'Yearly', value: 'yearly' },
        ],
      },
      {
        displayName: 'VAT Period Started At',
        name: 'vat_period_started_at',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
    ],
  },
];

const expenseCreateFields: INodeProperties[] = [
  {
    displayName: 'Input Type',
    name: 'inputType',
    type: 'options',
    default: 'base64',
    options: [
      { name: 'Base64 String', value: 'base64' },
      { name: 'Binary Property', value: 'binary' },
    ],
    description: 'Hogyan érkezik a számlakép tartalma',
    displayOptions: { show: { resource: ['expense'], operation: ['create'] } },
  },
  {
    displayName: 'Binary Property',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    placeholder: 'data',
    description: 'A bemeneti item binary mezőjének neve',
    displayOptions: {
      show: { resource: ['expense'], operation: ['create'], inputType: ['binary'] },
    },
  },
  {
    displayName: 'Filename',
    name: 'filename',
    type: 'string',
    default: '',
    description:
      'A számlakép fájlneve, pl. invoice.pdf. Binary módban opcionális — ha üres, a binary metaadatból veszi.',
    displayOptions: { show: { resource: ['expense'], operation: ['create'] } },
  },
  {
    displayName: 'Content (Base64)',
    name: 'content',
    type: 'string',
    default: '',
    typeOptions: { rows: 4 },
    description: 'A fájl tartalma base64 kódolásban',
    displayOptions: {
      show: { resource: ['expense'], operation: ['create'], inputType: ['base64'] },
    },
  },
  {
    displayName: 'Source',
    name: 'source',
    type: 'string',
    default: 'public_api',
    displayOptions: { show: { resource: ['expense'], operation: ['create'] } },
  },
];

const expenseSearchArtifactFields: INodeProperties[] = [
  {
    displayName: 'Filename',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['expense'], operation: ['searchArtifact'] } },
  },
  {
    displayName: 'Size (Bytes)',
    name: 'size',
    type: 'number',
    required: true,
    default: 0,
    displayOptions: { show: { resource: ['expense'], operation: ['searchArtifact'] } },
  },
  {
    displayName: 'Company IDs',
    name: 'company_ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2',
    description: 'Vesszővel elválasztott cég-azonosítók',
    displayOptions: { show: { resource: ['expense'], operation: ['searchArtifact'] } },
  },
];

export const expenseFields: INodeProperties[] = [
  ...expenseGetAllFields,
  ...expenseGetFields,
  ...expenseBulkIdFields,
  ...expenseUpdateFields,
  ...expenseCreateFields,
  ...expenseSearchArtifactFields,
];
