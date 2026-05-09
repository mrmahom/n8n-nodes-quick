import type {
  IDataObject,
  IExecuteFunctions,
  IGetNodeParameterOptions,
  IHttpRequestOptions,
  INode,
  INodeExecutionData,
} from 'n8n-workflow';

export interface MockCredential {
  apiToken?: string;
  baseUrl?: string;
  companyId?: string;
}

export interface MockExecuteOptions {
  /**
   * A workflow node-on értékelt `getNodeParameter` válaszok, kulcs = paraméter neve.
   * A teszt definíálja, mit lát a node — ez tükörképe a felhasználó által beállított paramétereknek.
   */
  parameters?: Record<string, unknown>;
  /** Bemeneti elemek (default: 1 üres). */
  inputItems?: INodeExecutionData[];
  /** Credential értékek. */
  credentials?: MockCredential;
  /** A `httpRequestWithAuthentication` válasza (vagy függvény, ha a kérés alapján akarunk válaszolni). */
  httpResponse?: unknown | ((options: IHttpRequestOptions) => unknown);
  /** Continue-on-fail kapcsoló. */
  continueOnFail?: boolean;
}

export interface MockExecuteHandle {
  context: IExecuteFunctions;
  /** A node által ténylegesen végrehajtott HTTP kérések, sorrendben. */
  httpCalls: IHttpRequestOptions[];
}

const defaultNode: INode = {
  id: 'test-node-id',
  name: 'QUiCK Test Node',
  type: 'n8n-nodes-quick.quick',
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
};

/**
 * Minimális, de hűséges `IExecuteFunctions` mock. Csak azokat a metódusokat
 * implementálja, amelyeket a Quick node ténylegesen használ — minden mást
 * `jest.fn()` placeholder-rel pótol, hogy ha új helyen kerül felhasználásra,
 * az látható módon explicitly kerüljön be a mockba.
 */
export function createMockExecuteFunctions(options: MockExecuteOptions = {}): MockExecuteHandle {
  const params = options.parameters ?? {};
  const inputItems: INodeExecutionData[] = options.inputItems ?? [{ json: {} }];
  const credentials: MockCredential = {
    apiToken: 'test-token',
    baseUrl: 'https://api.quick.riport.co.hu',
    ...options.credentials,
  };

  const httpCalls: IHttpRequestOptions[] = [];

  const httpRequestWithAuthentication = jest.fn(
    async (_credentialName: string, opts: IHttpRequestOptions) => {
      httpCalls.push(opts);
      const responder = options.httpResponse;
      if (typeof responder === 'function') {
        return (responder as (o: IHttpRequestOptions) => unknown)(opts);
      }
      return responder ?? {};
    },
  );

  const getNodeParameter = jest.fn(
    (
      name: string,
      _itemIndex: number,
      fallback?: unknown,
      _opts?: IGetNodeParameterOptions,
    ): unknown => {
      if (Object.prototype.hasOwnProperty.call(params, name)) {
        return params[name];
      }
      return fallback;
    },
  );

  const getCredentials = jest.fn(async (_name: string) => credentials as IDataObject);

  const returnJsonArray = (input: IDataObject | IDataObject[]): INodeExecutionData[] => {
    const arr = Array.isArray(input) ? input : [input];
    return arr.map((entry) => ({ json: entry ?? {} }));
  };

  const constructExecutionMetaData = (
    inputData: INodeExecutionData[],
    meta: { itemData: { item: number } },
  ): INodeExecutionData[] => inputData.map((d) => ({ ...d, pairedItem: meta.itemData }));

  const context = {
    getInputData: () => inputItems,
    getNodeParameter,
    getCredentials,
    getNode: () => defaultNode,
    continueOnFail: () => Boolean(options.continueOnFail),
    helpers: {
      httpRequestWithAuthentication,
      returnJsonArray,
      constructExecutionMetaData,
    },
  } as unknown as IExecuteFunctions;

  return { context, httpCalls };
}
