import {
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
} from 'n8n-workflow';

import { getQuickClient } from './utils';

interface PollState {
  /** Az eddig látott legmagasabb ID — túlmutatás detektálásra. */
  lastId?: number;
  /** Utolsó poll időpontja ISO string-ként. */
  lastSeenAt?: string;
}

export class QuickTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'QUiCK Trigger',
    name: 'quickTrigger',
    icon: 'file:quick.svg',
    group: ['trigger'],
    version: [1],
    description:
      'Periodikusan poll-ozza a QUiCK API-t új események után (új kiadás / bevétel / dokumentum stb.)',
    polling: true,
    defaults: { name: 'QUiCK Trigger' },
    inputs: [],
    outputs: ['main'],
    credentials: [{ name: 'quickApi', required: true }],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        noDataExpression: true,
        default: 'newExpense',
        options: [
          {
            name: 'Document — New',
            value: 'newDocument',
            description: 'Új dokumentumok',
          },
          {
            name: 'Expense — Due Soon',
            value: 'expenseDueSoon',
            description: 'Hamarosan lejáró kiadások',
          },
          {
            name: 'Expense — Expired',
            value: 'expenseExpired',
            description: 'Lejárt fizetésű kiadások',
          },
          {
            name: 'Expense — New',
            value: 'newExpense',
            description: 'Az utolsó poll óta érkezett új kiadások',
          },
          {
            name: 'Expense — Updated',
            value: 'updatedExpense',
            description: 'Az utolsó poll óta frissült kiadások',
          },
          {
            name: 'Income — Due Soon',
            value: 'incomeDueSoon',
            description: 'Hamarosan lejáró bevételek',
          },
        ],
      },
      {
        displayName: 'Additional Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        options: [
          {
            displayName: 'Has Artifact Only',
            name: 'has_artifact',
            type: 'boolean',
            default: false,
            description: 'Whether only items with attached file are included',
            displayOptions: {
              show: {
                '/event': ['newExpense', 'updatedExpense', 'expenseDueSoon', 'expenseExpired'],
              },
            },
          },
          {
            displayName: 'Partner Contains',
            name: 'partner',
            type: 'string',
            default: '',
            description: 'Csak az adott partner-névrészletre szűrjön',
          },
          {
            displayName: 'Tag IDs',
            name: 'with_tag_ids',
            type: 'string',
            default: '',
            description: 'Vesszővel elválasztott tag azonosítók',
          },
        ],
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const event = this.getNodeParameter('event') as string;
    const filters = this.getNodeParameter('filters', {}) as IDataObject;
    const staticData = this.getWorkflowStaticData('node') as PollState;
    const client = await getQuickClient(this);

    const { endpoint, qs } = mapEventToRequest(event, filters);
    const response = await client.transport.request(
      { method: 'GET', path: endpoint, query: qs },
    );
    const items = extractList(response);

    if (items.length === 0) {
      staticData.lastSeenAt = new Date().toISOString();
      return null;
    }

    // Csak az eddig nem látott elemeket (id > lastId) adjuk tovább.
    const lastId = typeof staticData.lastId === 'number' ? staticData.lastId : 0;
    const fresh = items.filter((it) => Number(it.id ?? 0) > lastId);

    if (fresh.length > 0) {
      const maxId = Math.max(...fresh.map((it) => Number(it.id ?? 0)));
      staticData.lastId = Math.max(lastId, maxId);
    }
    staticData.lastSeenAt = new Date().toISOString();

    if (fresh.length === 0) return null;
    return [this.helpers.returnJsonArray(fresh)];
  }
}

function mapEventToRequest(
  event: string,
  filters: IDataObject,
): { endpoint: string; qs: IDataObject } {
  const baseFilter: IDataObject = {};
  if (typeof filters.partner === 'string' && filters.partner.trim()) {
    baseFilter.partner = filters.partner.trim();
  }
  if (typeof filters.with_tag_ids === 'string' && filters.with_tag_ids.trim()) {
    const arr = filters.with_tag_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (arr.length > 0) baseFilter.with_tag_ids = arr;
  }
  if (filters.has_artifact === true) baseFilter.has_artifact = true;

  switch (event) {
    case 'newExpense':
      return {
        endpoint: '/2/expenses/',
        qs: { ...baseFilter, is_new: true, ordering: '-id', page: 1, page_size: 100 },
      };
    case 'updatedExpense':
      return {
        endpoint: '/2/expenses/',
        qs: { ...baseFilter, is_updated: true, ordering: '-id', page: 1, page_size: 100 },
      };
    case 'expenseDueSoon':
      return {
        endpoint: '/2/expenses/',
        qs: { ...baseFilter, is_expiring: true, ordering: '-id', page: 1, page_size: 100 },
      };
    case 'expenseExpired':
      return {
        endpoint: '/2/expenses/',
        qs: { ...baseFilter, is_expired: true, ordering: '-id', page: 1, page_size: 100 },
      };
    case 'newDocument':
      return {
        endpoint: '/1/documents/',
        qs: { is_new: true, ordering: '-created_at', page: 1, page_size: 100 },
      };
    case 'incomeDueSoon':
      return {
        endpoint: '/1/incomes/',
        qs: {
          ...(baseFilter.partner ? { partner: baseFilter.partner } : {}),
          is_due_soon: true,
          ordering: '-due_at',
          page: 1,
          page_size: 100,
        },
      };
    default:
      // eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
      throw new Error(`Unknown event: ${event}`);
  }
}

function extractList(response: unknown): IDataObject[] {
  const r = response as { results?: IDataObject[] } | IDataObject[] | null | undefined;
  if (Array.isArray(r)) return r;
  if (r && Array.isArray(r.results)) return r.results;
  return [];
}
