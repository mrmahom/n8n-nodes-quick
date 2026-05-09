import { INodeProperties } from 'n8n-workflow';

export const taxOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['tax'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        action: 'Create taxes',
        description: 'Új havi adótételek létrehozása',
      },
      {
        name: 'Delete',
        value: 'delete',
        action: 'Delete taxes',
        description: 'Adótételek törlése ID alapján',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many taxes',
        description: 'Havi adók listázása',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update taxes',
        description: 'Adótételek módosítása',
      },
    ],
    default: 'getAll',
  },
];

export const taxFields: INodeProperties[] = [
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['tax'], operation: ['getAll'] } },
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
    displayName: 'Taxes',
    name: 'taxes',
    placeholder: 'Add Tax',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['tax'], operation: ['create'] } },
    options: [
      {
        name: 'tax',
        displayName: 'Tax',
        values: [
          {
            displayName: 'Title',
            name: 'title',
            type: 'string',
            default: '',
            placeholder: 'YYYY-MM-DD',
            description: 'A hónap kezdete (YYYY-MM-01 formátumban)',
          },
          {
            displayName: 'Due At',
            name: 'due_at',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'YYYY-MM-DD',
          },
          {
            displayName: 'Amount',
            name: 'amount',
            type: 'number',
            required: true,
            default: 0,
          },
          { displayName: 'Code', name: 'code', type: 'string', default: '' },
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Currency', name: 'currency', type: 'string', default: 'HUF' },
          { displayName: 'Account Number', name: 'account_number', type: 'string', default: '' },
          { displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
        ],
      },
    ],
  },

  // Update
  {
    displayName: 'Taxes',
    name: 'taxes',
    placeholder: 'Add Tax',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['tax'], operation: ['update'] } },
    options: [
      {
        name: 'tax',
        displayName: 'Tax',
        values: [
          {
            displayName: 'ID',
            name: 'id',
            type: 'number',
            required: true,
            default: 0,
          },
          {
            displayName: 'Title',
            name: 'title',
            type: 'string',
            default: '',
            placeholder: 'YYYY-MM-DD',
          },
          {
            displayName: 'Due At',
            name: 'due_at',
            type: 'string',
            default: '',
            placeholder: 'YYYY-MM-DD',
          },
          { displayName: 'Amount', name: 'amount', type: 'number', default: 0 },
          { displayName: 'Code', name: 'code', type: 'string', default: '' },
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Account Number', name: 'account_number', type: 'string', default: '' },
          { displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
        ],
      },
    ],
  },

  // Delete
  {
    displayName: 'Tax IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    description: 'Vesszővel elválasztott azonosítók',
    displayOptions: { show: { resource: ['tax'], operation: ['delete'] } },
  },
];
