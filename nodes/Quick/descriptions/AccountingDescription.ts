import { INodeProperties } from 'n8n-workflow';

// LEDGER NUMBER (főkönyvi szám)

export const ledgerNumberOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['ledgerNumber'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        action: 'Create ledger numbers',
        description: 'Új főkönyvi számok létrehozása',
      },
      {
        name: 'Delete',
        value: 'delete',
        action: 'Delete ledger numbers',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many ledger numbers',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a ledger number',
      },
    ],
    default: 'getAll',
  },
];

export const ledgerNumberFields: INodeProperties[] = [
  // Create
  {
    displayName: 'Ledger Numbers',
    name: 'ledger_numbers',
    placeholder: 'Add Ledger Number',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['ledgerNumber'], operation: ['create'] } },
    options: [
      {
        name: 'item',
        displayName: 'Ledger Number',
        values: [
          { displayName: 'Code', name: 'code', type: 'string', required: true, default: '' },
          { displayName: 'Name', name: 'name', type: 'string', required: true, default: '' },
        ],
      },
    ],
  },

  // Update
  {
    displayName: 'Ledger Number ID',
    name: 'ledgerNumberId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['ledgerNumber'], operation: ['update'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['ledgerNumber'], operation: ['update'] } },
    options: [
      { displayName: 'Code', name: 'code', type: 'string', default: '' },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
    ],
  },

  // Delete
  {
    displayName: 'Ledger Number IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    displayOptions: { show: { resource: ['ledgerNumber'], operation: ['delete'] } },
  },
];

// VAT CATEGORY (ÁFA kategória)

export const vatCategoryOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['vatCategory'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create VAT categories' },
      { name: 'Delete', value: 'delete', action: 'Delete VAT categories' },
      { name: 'Get Many', value: 'getAll', action: 'Get many VAT categories' },
      { name: 'Update', value: 'update', action: 'Update a VAT category' },
    ],
    default: 'getAll',
  },
];

export const vatCategoryFields: INodeProperties[] = [
  // Create
  {
    displayName: 'VAT Categories',
    name: 'vat_categories',
    placeholder: 'Add VAT Category',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['vatCategory'], operation: ['create'] } },
    options: [
      {
        name: 'item',
        displayName: 'VAT Category',
        values: [
          {
            displayName: 'Percent',
            name: 'percent',
            type: 'number',
            required: true,
            default: 0,
          },
          {
            displayName: 'VAT Area',
            name: 'vat_area',
            type: 'options',
            required: true,
            default: 'HU',
            options: [
              { name: 'EU', value: 'EU' },
              { name: 'Hungary', value: 'HU' },
              { name: 'Third Country', value: '3RD' },
            ],
          },
          { displayName: 'Code', name: 'code', type: 'string', default: '' },
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          {
            displayName: 'Country',
            name: 'country',
            type: 'string',
            default: '',
            description: '2 betűs ISO kód, pl. HU.',
          },
        ],
      },
    ],
  },

  // Update
  {
    displayName: 'VAT Category ID',
    name: 'companyVatCategoryId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['vatCategory'], operation: ['update'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['vatCategory'], operation: ['update'] } },
    options: [
      { displayName: 'Code', name: 'code', type: 'string', default: '' },
      { displayName: 'Country', name: 'country', type: 'string', default: '' },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Percent', name: 'percent', type: 'number', default: 0 },
      {
        displayName: 'VAT Area',
        name: 'vat_area',
        type: 'options',
        default: 'HU',
        options: [
          { name: 'EU', value: 'EU' },
          { name: 'Hungary', value: 'HU' },
          { name: 'Third Country', value: '3RD' },
        ],
      },
    ],
  },

  // Delete
  {
    displayName: 'VAT Category IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    displayOptions: { show: { resource: ['vatCategory'], operation: ['delete'] } },
  },
];

// TAX CODE (adókód)

export const taxCodeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['taxCode'] } },
    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many tax codes' }],
    default: 'getAll',
  },
];

export const taxCodeFields: INodeProperties[] = [];
