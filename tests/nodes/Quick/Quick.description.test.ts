import { INodeProperties } from 'n8n-workflow';
import { Quick } from '../../../nodes/Quick/Quick.node';

describe('Quick node description', () => {
  const node = new Quick();
  const props = node.description.properties;

  function operationsForResource(resource: string): string[] {
    const operationProp = props.find(
      (p) =>
        p.name === 'operation' &&
        p.displayOptions?.show?.resource?.includes(resource as never),
    );
    if (!operationProp) return [];
    return ((operationProp.options ?? []) as Array<{ value: string }>).map((o) => o.value);
  }

  it('alap metaadatok stimmelnek', () => {
    expect(node.description.name).toBe('quick');
    expect(node.description.displayName).toBe('QUiCK');
    expect(node.description.version).toEqual([1]);
    expect(node.description.icon).toBe('file:quick.svg');
    expect(node.description.usableAsTool).toBe(true);
    expect(node.description.outputs).toEqual(['main', 'main']);
  });

  it('a node tokenAuth credential-t követel meg', () => {
    expect(node.description.credentials).toEqual([
      expect.objectContaining({ name: 'quickApi', required: true }),
    ]);
  });

  it('resource lista a várt 16 resource-ot tartalmazza, OAuth-only nélkül', () => {
    const resourceProp = props.find((p) => p.name === 'resource');
    expect(resourceProp).toBeDefined();
    const values = ((resourceProp?.options ?? []) as Array<{ value: string }>).map(
      (o) => o.value,
    );
    expect(values).toEqual(
      expect.arrayContaining([
        'account',
        'artifact',
        'auditXml',
        'company',
        'document',
        'documentType',
        'expense',
        'income',
        'ledgerNumber',
        'partner',
        'payment',
        'pulse',
        'salary',
        'tax',
        'taxCode',
        'vatCategory',
      ]),
    );
    expect(values).not.toContain('user');
    expect(values).toHaveLength(16);
  });

  it('minden resource-hoz tartozik legalább egy operation', () => {
    const resourceProp = props.find((p) => p.name === 'resource');
    const resources = ((resourceProp?.options ?? []) as Array<{ value: string }>).map(
      (o) => o.value,
    );
    for (const resource of resources) {
      expect(operationsForResource(resource).length).toBeGreaterThan(0);
    }
  });

  it('Company resource-nak nincs Get Many opciója (OAuth-only volt)', () => {
    expect(operationsForResource('company')).toEqual(
      expect.arrayContaining(['getInfo', 'updateInfo']),
    );
    expect(operationsForResource('company')).not.toContain('getAll');
  });

  it('Expense resource bulk akciói mind jelen vannak', () => {
    expect(operationsForResource('expense')).toEqual(
      expect.arrayContaining([
        'getAll',
        'get',
        'create',
        'update',
        'approve',
        'unapprove',
        'check',
        'uncheck',
        'export',
        'quarantineAccept',
        'searchArtifact',
      ]),
    );
  });

  it('a description-ben sehol nincs OAuth referencia', () => {
    const json = JSON.stringify(node.description);
    expect(json).not.toMatch(/oauth/i);
    expect(json).not.toMatch(/\/2\/companies\//);
    expect(json).not.toMatch(/\/2\/user-profile\//);
  });

  it('minden resource-specifikus mező displayOptions-ben létező resource-ra hivatkozik', () => {
    const resourceProp = props.find((p) => p.name === 'resource');
    const knownResources = new Set(
      ((resourceProp?.options ?? []) as Array<{ value: string }>).map((o) => o.value),
    );
    const offenders: string[] = [];
    for (const prop of props) {
      const resources = prop.displayOptions?.show?.resource as string[] | undefined;
      if (!resources) continue;
      for (const r of resources) {
        if (!knownResources.has(r)) offenders.push(`${prop.name} → ${r}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('nincs duplikált name + ugyanazon resource/operation displayOptions kombináció', () => {
    const seen = new Map<string, number>();
    const collisions: string[] = [];
    for (const prop of props as INodeProperties[]) {
      const resources = prop.displayOptions?.show?.resource ?? ['*'];
      const operations = prop.displayOptions?.show?.operation ?? ['*'];
      for (const r of resources as string[]) {
        for (const op of operations as string[]) {
          const key = `${prop.name}|${r}|${op}`;
          const count = (seen.get(key) ?? 0) + 1;
          seen.set(key, count);
          if (count > 1) collisions.push(key);
        }
      }
    }
    expect(collisions).toEqual([]);
  });
});
