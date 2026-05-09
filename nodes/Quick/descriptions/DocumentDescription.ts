import { INodeProperties } from 'n8n-workflow';

export const documentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['document'] } },
    options: [
      {
        name: 'Attach',
        value: 'attach',
        action: 'Attach documents',
        description: 'Dokumentumok hozzárendelése bevételhez/kiadáshoz/partnerhez',
      },
      {
        name: 'Create',
        value: 'create',
        action: 'Create documents',
        description: 'Új dokumentumok feltöltése',
      },
      {
        name: 'Delete',
        value: 'delete',
        action: 'Delete documents',
        description: 'Dokumentumok törlése ID alapján',
      },
      {
        name: 'Detach',
        value: 'detach',
        action: 'Detach documents',
        description: 'Dokumentum-csatolások eltávolítása',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get a document',
        description: 'Dokumentum részletes adatainak lekérése',
      },
      {
        name: 'Get File URLs',
        value: 'getFiles',
        action: 'Get document files',
        description: 'Dokumentumok letölthető URL-jeinek lekérése',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many documents',
        description: 'Dokumentumok listázása',
      },
      {
        name: 'Search',
        value: 'search',
        action: 'Search documents by name and size',
        description: 'Megnézi, létezik-e már ilyen nevű és méretű dokumentum',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a document',
        description: 'Dokumentum metaadatainak módosítása',
      },
    ],
    default: 'getAll',
  },
];

const documentListFilters: INodeProperties = {
  displayName: 'Filters',
  name: 'filters',
  type: 'collection',
  placeholder: 'Add Filter',
  default: {},
  displayOptions: {
    show: { resource: ['document'], operation: ['getAll', 'getFiles'] },
  },
  options: [
    {
      displayName: 'Contains Payable',
      name: 'contains_payable',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'From Date',
      name: 'from_date',
      type: 'string',
      default: '',
      placeholder: 'YYYY-MM-DD',
    },
    {
      displayName: 'IDs',
      name: 'ids',
      type: 'string',
      default: '',
      description: 'Vesszővel elválasztott azonosítók',
    },
    {
      displayName: 'Is Attached',
      name: 'is_attached',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Is Filed',
      name: 'is_filed',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Is New',
      name: 'is_new',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Is Updated',
      name: 'is_updated',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Ordering',
      name: 'ordering',
      type: 'string',
      default: '-created_at',
    },
    {
      displayName: 'Search',
      name: 'search',
      type: 'string',
      default: '',
    },
    {
      displayName: 'To Date',
      name: 'to_date',
      type: 'string',
      default: '',
      placeholder: 'YYYY-MM-DD',
    },
    {
      displayName: 'With Document Type IDs',
      name: 'with_document_type_ids',
      type: 'string',
      default: '',
    },
    {
      displayName: 'With Tag IDs',
      name: 'with_tag_ids',
      type: 'string',
      default: '',
    },
  ],
};

export const documentFields: INodeProperties[] = [
  documentListFilters,

  {
    displayName: 'Document',
    name: 'documentId',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'id', value: '' },
    displayOptions: { show: { resource: ['document'], operation: ['get', 'update'] } },
    modes: [
      { displayName: 'ID', name: 'id', type: 'string', placeholder: 'pl. 12345' },
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchDocuments',
          searchable: true,
        },
      },
    ],
  },

  // Update
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['document'], operation: ['update'] } },
    options: [
      { displayName: 'Contains Payable', name: 'contains_payable', type: 'boolean', default: false },
      { displayName: 'Document Type ID', name: 'document_type_id', type: 'number', default: 0 },
      {
        displayName: 'Keywords',
        name: 'keywords',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott kulcsszavak',
      },
      { displayName: 'Recipient', name: 'recipient', type: 'string', default: '' },
      { displayName: 'Sender', name: 'sender', type: 'string', default: '' },
      {
        displayName: 'Simple Tag IDs',
        name: 'simple_tag_ids',
        type: 'string',
        default: '',
        description: 'Vesszővel elválasztott címke azonosítók',
      },
      {
        displayName: 'Summary',
        name: 'summary',
        type: 'string',
        default: '',
        typeOptions: { rows: 3 },
      },
      { displayName: 'Title', name: 'title', type: 'string', default: '' },
    ],
  },

  // Create
  {
    displayName: 'Documents',
    name: 'documents',
    placeholder: 'Add Document',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    required: true,
    displayOptions: { show: { resource: ['document'], operation: ['create'] } },
    options: [
      {
        name: 'document',
        displayName: 'Document',
        values: [
          {
            displayName: 'Filename',
            name: 'filename',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Content (Base64)',
            name: 'content',
            type: 'string',
            required: true,
            default: '',
            typeOptions: { rows: 4 },
          },
          { displayName: 'Title', name: 'title', type: 'string', default: '' },
          {
            displayName: 'Summary',
            name: 'summary',
            type: 'string',
            default: '',
            typeOptions: { rows: 3 },
          },
          { displayName: 'Document Type ID', name: 'document_type_id', type: 'number', default: 0 },
          {
            displayName: 'Keywords',
            name: 'keywords',
            type: 'string',
            default: '',
            description: 'Vesszővel elválasztott kulcsszavak',
          },
          {
            displayName: 'Simple Tag IDs',
            name: 'simple_tag_ids',
            type: 'string',
            default: '',
            description: 'Vesszővel elválasztott címke azonosítók',
          },
          { displayName: 'Sender', name: 'sender', type: 'string', default: '' },
          { displayName: 'Recipient', name: 'recipient', type: 'string', default: '' },
          {
            displayName: 'Contains Payable',
            name: 'contains_payable',
            type: 'boolean',
            default: false,
          },
        ],
      },
    ],
  },
  {
    displayName: 'Source',
    name: 'source',
    type: 'string',
    default: 'public_api',
    displayOptions: { show: { resource: ['document'], operation: ['create'] } },
  },

  // Delete
  {
    displayName: 'Document IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    description: 'Vesszővel elválasztott azonosítók',
    displayOptions: { show: { resource: ['document'], operation: ['delete'] } },
  },

  // Search
  {
    displayName: 'Filename',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['document'], operation: ['search'] } },
  },
  {
    displayName: 'Size (Bytes)',
    name: 'size',
    type: 'number',
    required: true,
    default: 0,
    displayOptions: { show: { resource: ['document'], operation: ['search'] } },
  },
  {
    displayName: 'Company IDs',
    name: 'company_ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2',
    displayOptions: { show: { resource: ['document'], operation: ['search'] } },
  },

  // Attach / Detach
  {
    displayName: 'Document IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '1,2,3',
    description: 'Vesszővel elválasztott azonosítók',
    displayOptions: { show: { resource: ['document'], operation: ['attach', 'detach'] } },
  },
  {
    displayName: 'Target Type',
    name: 'target_type',
    type: 'options',
    required: true,
    default: 'expense',
    options: [
      { name: 'Expense', value: 'expense' },
      { name: 'Income', value: 'income' },
      { name: 'Partner', value: 'partner' },
    ],
    displayOptions: { show: { resource: ['document'], operation: ['attach', 'detach'] } },
  },
  {
    displayName: 'Target ID',
    name: 'target_id',
    type: 'number',
    required: true,
    default: 0,
    displayOptions: { show: { resource: ['document'], operation: ['attach', 'detach'] } },
  },
];
