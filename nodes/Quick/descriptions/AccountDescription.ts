import { INodeProperties } from 'n8n-workflow';

export const accountOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['account'] } },
    options: [
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many paid throughs',
        description: 'Bankszámlák / pénztárak listázása',
      },
    ],
    default: 'getAll',
  },
];

export const accountFields: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['account'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: { resource: ['account'], operation: ['getAll'], returnAll: [false] },
    },
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: { show: { resource: ['account'], operation: ['getAll'] } },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
      },
    ],
  },
];
