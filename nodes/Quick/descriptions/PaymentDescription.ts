import { INodeProperties } from 'n8n-workflow';

export const paymentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['payment'] } },
    options: [
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many payments',
        description: 'Banki kifizetések napi bontásban',
      },
    ],
    default: 'getAll',
  },
];

export const paymentFields: INodeProperties[] = [
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['payment'], operation: ['getAll'] } },
    options: [
      {
        displayName: 'Date',
        name: 'date',
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
        displayName: 'To Date',
        name: 'to_date',
        type: 'string',
        default: '',
        placeholder: 'YYYY-MM-DD',
      },
    ],
  },
];
