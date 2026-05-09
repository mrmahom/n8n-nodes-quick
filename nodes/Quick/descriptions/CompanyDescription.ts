import { INodeProperties } from 'n8n-workflow';

export const companyOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['company'] } },
    options: [
      {
        name: 'Get Info',
        value: 'getInfo',
        action: 'Get company info',
        description: 'Az aktuális (token-höz tartozó) cég adatai',
      },
      {
        name: 'Update Info',
        value: 'updateInfo',
        action: 'Update company info',
      },
    ],
    default: 'getInfo',
  },
];

export const companyFields: INodeProperties[] = [
  {
    displayName: 'Company ID',
    name: 'companyId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['company'], operation: ['updateInfo'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['company'], operation: ['updateInfo'] } },
    options: [
      { displayName: 'Advanced Accounting', name: 'advanced_accounting', type: 'boolean', default: false },
      { displayName: 'Default Currency Name', name: 'default_currency_name', type: 'string', default: '' },
      { displayName: 'Enable Accounting ID', name: 'enable_accounting_id', type: 'boolean', default: false },
      { displayName: 'Enable VAT Period', name: 'enable_vat_period', type: 'boolean', default: false },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Tax Account Number', name: 'tax_account_number', type: 'string', default: '' },
    ],
  },
];

// DOCUMENT TYPE

export const documentTypeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['documentType'] } },
    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many document types' }],
    default: 'getAll',
  },
];

export const documentTypeFields: INodeProperties[] = [];

// AUDIT XML

export const auditXmlOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['auditXml'] } },
    options: [
      {
        name: 'Upload',
        value: 'upload',
        action: 'Upload audit XML',
        description: 'NAV audit XML feltöltése',
      },
    ],
    default: 'upload',
  },
];

export const auditXmlFields: INodeProperties[] = [
  {
    displayName: 'Input Type',
    name: 'inputType',
    type: 'options',
    default: 'base64',
    options: [
      { name: 'Base64 String', value: 'base64' },
      { name: 'Binary Property', value: 'binary' },
    ],
    displayOptions: { show: { resource: ['auditXml'], operation: ['upload'] } },
  },
  {
    displayName: 'Binary Property',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    displayOptions: {
      show: { resource: ['auditXml'], operation: ['upload'], inputType: ['binary'] },
    },
  },
  {
    displayName: 'Filename',
    name: 'filename',
    type: 'string',
    default: '',
    description:
      'Az XML fájl neve. Binary módban opcionális — ha üres, a binary metaadatból veszi.',
    displayOptions: { show: { resource: ['auditXml'], operation: ['upload'] } },
  },
  {
    displayName: 'Content (Base64)',
    name: 'content',
    type: 'string',
    default: '',
    typeOptions: { rows: 4 },
    displayOptions: {
      show: { resource: ['auditXml'], operation: ['upload'], inputType: ['base64'] },
    },
  },
];

// ARTIFACT (számlaképek lekérése bevétel/kiadás ID listához)

export const artifactOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['artifact'] } },
    options: [
      {
        name: 'Get Expense Artifacts',
        value: 'getExpense',
        action: 'Get expense artifacts',
        description: 'Számlaképek lekérése kiadás ID-k alapján',
      },
      {
        name: 'Get Income Artifacts',
        value: 'getIncome',
        action: 'Get income artifacts',
        description: 'Számlaképek lekérése bevétel ID-k alapján',
      },
    ],
    default: 'getExpense',
  },
];

export const artifactFields: INodeProperties[] = [
  {
    displayName: 'IDs',
    name: 'ids',
    type: 'string',
    required: true,
    default: '',
    placeholder: '101,102,103',
    description: 'Vesszővel elválasztott bevétel- vagy kiadás-azonosítók',
    displayOptions: { show: { resource: ['artifact'] } },
  },
];
