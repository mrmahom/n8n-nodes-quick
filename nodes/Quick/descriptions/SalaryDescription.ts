import { INodeProperties } from 'n8n-workflow';

export const salaryOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['salary'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        action: 'Create salaries',
        description: 'Új havi bértételek létrehozása',
      },
      {
        name: 'Delete',
        value: 'delete',
        action: 'Delete salaries',
        description: 'Bértételek törlése ID alapján',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many salaries',
        description: 'Havi bérek listázása',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update salaries',
        description: 'Bértételek módosítása',
      },
    ],
    default: 'getAll',
  },
];

export const salaryFields: INodeProperties[] = [
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['salary'], operation: ['getAll'] } },
    options: [
      {
        displayName: 'From Date',
        name: 'from_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      {
        displayName: 'To Date',
        name: 'to_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott mezőnevek',
      },
    ],
  },

  // Create
  {
    displayName: 'Salaries',
    name: 'salaries',
    placeholder: 'Add Salary',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['salary'], operation: ['create'] } },
    options: [
      {
        name: 'salary',
        displayName: 'Salary',
        values: [
          {
            displayName: 'Title',
            name: 'title',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'YYYY-MM-DD',
            description: 'A hónap kezdete (YYYY-MM-01 formátumban)',
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Amount',
            name: 'amount',
            type: 'number',
            required: true,
            default: 0,
          },
          {
            displayName: 'Due At',
            name: 'due_at',
            type: 'string',
            default: '',
            placeholder: 'YYYY-MM-DD',
          },
          { displayName: 'Currency', name: 'currency', type: 'string', default: 'HUF' },
          { displayName: 'Account Number', name: 'account_number', type: 'string', default: '' },
          { displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
        ],
      },
    ],
  },

  // Update
  {
    displayName: 'Salaries',
    name: 'salaries',
    placeholder: 'Add Salary',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['salary'], operation: ['update'] } },
    options: [
      {
        name: 'salary',
        displayName: 'Salary',
        values: [
          {
            displayName: 'ID',
            name: 'id',
            type: 'number',
            required: true,
            default: 0,
          },
          { displayName: 'Title', name: 'title', type: 'string', default: '' },
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          {
            displayName: 'Amount',
            name: 'amount',
            type: 'number',
            required: true,
            default: 0,
          },
          { displayName: 'Account Number', name: 'account_number', type: 'string', default: '' },
          { displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
        ],
      },
    ],
  },

  // Delete
  {
    displayName: 'Salary IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    description: 'Vesszővel elválasztott azonosítók',
    displayOptions: { show: { resource: ['salary'], operation: ['delete'] } },
  },
];
