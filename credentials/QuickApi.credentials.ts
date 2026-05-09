import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class QuickApi implements ICredentialType {
  name = 'quickApi';
  displayName = 'QUiCK API';
  // eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-miscased
  documentationUrl = 'https://helloquick.riport.app';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'A QUiCK admin felületén generált Public API token. A kérésekhez "Token <api_token>" formában kerül beillesztésre.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.quick.riport.co.hu',
      description: 'A QUiCK Public API alap URL-je. Ritkán szükséges módosítani.',
    },
    {
      displayName: 'Company ID (opcionális)',
      name: 'companyId',
      type: 'string',
      default: '',
      description:
        'Ha több cégre van jogosultságod, ide írhatod a Quick-Company-Id fejléc értékét. Üresen hagyva a token alapcégét használja.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Token {{$credentials.apiToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/2/company-info/',
      method: 'GET',
    },
  };
}
