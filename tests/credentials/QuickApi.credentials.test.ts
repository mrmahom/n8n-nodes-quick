import { QuickApi } from '../../credentials/QuickApi.credentials';

describe('QuickApi credentials', () => {
  const credential = new QuickApi();

  it('belső azonosítója és megjelenítendő neve a konvenciónak megfelelő', () => {
    expect(credential.name).toBe('quickApi');
    expect(credential.displayName).toMatch(/QUiCK/);
    expect(credential.documentationUrl).toMatch(/^https:\/\//);
  });

  it('definiálja az API Token, Base URL és Company ID mezőket', () => {
    const names = credential.properties.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['apiToken', 'baseUrl', 'companyId']));
  });

  it('az API Token kötelező és jelszó típusú', () => {
    const token = credential.properties.find((p) => p.name === 'apiToken');
    expect(token).toBeDefined();
    expect(token?.required).toBe(true);
    expect(token?.type).toBe('string');
    expect(token?.typeOptions?.password).toBe(true);
  });

  it('a Base URL alapértelmezésben a public api domainre mutat', () => {
    const baseUrl = credential.properties.find((p) => p.name === 'baseUrl');
    expect(baseUrl?.default).toBe('https://api.quick.riport.co.hu');
  });

  it('Token prefixszel és expression-nel illeszti be az Authorization fejlécet', () => {
    const headers = credential.authenticate.properties?.headers ?? {};
    expect(headers).toMatchObject({
      Authorization: '=Token {{$credentials.apiToken}}',
    });
  });

  it('tokenAuth-ot vár — sehol nincs OAuth referencia', () => {
    const json = JSON.stringify(credential);
    expect(json).not.toMatch(/oauth/i);
  });

  it('a credential teszt egy valós, token-os GET végpontra mutat', () => {
    expect(credential.test.request.method).toBe('GET');
    expect(credential.test.request.url).toBe('/2/company-info/');
    expect(credential.test.request.baseURL).toBe('={{$credentials.baseUrl}}');
  });
});
