import { INodeProperties } from 'n8n-workflow';

export const incomeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['income'] } },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get an income',
        description: 'Egy bevétel részletes adatainak lekérése',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many incomes',
        description: 'Bevételek listázása szűrhetően',
      },
    ],
    default: 'getAll',
  },
];

export const incomeFields: INodeProperties[] = [
  {
    displayName: 'Income',
    name: 'incomeId',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'id', value: '' },
    description: 'A bevétel megadása ID-val vagy listából',
    displayOptions: { show: { resource: ['income'], operation: ['get'] } },
    modes: [
      { displayName: 'ID', name: 'id', type: 'string', placeholder: 'pl. 12345' },
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchIncomes',
          searchable: true,
        },
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['income'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: { resource: ['income'], operation: ['getAll'], returnAll: [false] },
    },
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['income'], operation: ['getAll'] } },
    options: [
      {
        displayName: 'Due At',
        name: 'due_at',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      {
        displayName: 'From Date',
        name: 'from_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      {
        displayName: 'Invoice Number',
        name: 'invoice_number',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Is Due Soon',
        name: 'is_due_soon',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Is Expired',
        name: 'is_expired',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Ordering',
        name: 'ordering',
        type: 'string',
        default: '',
        description: 'Pl. -due_at, gross_amount, partner.',
      },
      {
        displayName: 'Paid Status',
        name: 'paid_status',
        type: 'multiOptions',
        default: [],
        options: [
          { name: 'No', value: 1 },
          { name: 'Yes', value: 2 },
          { name: 'Installment', value: 3 },
        ],
      },
      {
        displayName: 'Partner',
        name: 'partner',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Payment Method',
        name: 'payment_method',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Revenue Types',
        name: 'revenue_types',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott bevétel típusok',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott címke nevek',
      },
      {
        displayName: 'To Date',
        name: 'to_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
    ],
  },
];
