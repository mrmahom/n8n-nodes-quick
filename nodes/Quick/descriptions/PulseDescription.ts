import { INodeProperties } from 'n8n-workflow';

export const pulseOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['pulse'] } },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get pulse data',
        description: 'Aktuális banki egyenlegek és napi pulse adatok',
      },
    ],
    default: 'get',
  },
];

export const pulseFields: INodeProperties[] = [];
