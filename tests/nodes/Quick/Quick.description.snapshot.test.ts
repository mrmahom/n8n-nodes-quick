import { Quick } from '../../../nodes/Quick/Quick.node';

const node = new Quick();
const props = node.description.properties;

interface OptionLike {
  name: string;
  value: string;
}

function getResourceProp() {
  return props.find((p) => p.name === 'resource');
}

function getOperationsForResource(resource: string): OptionLike[] {
  const opProp = props.find(
    (p) =>
      p.name === 'operation' &&
      (p.displayOptions?.show?.resource as string[] | undefined)?.includes(resource),
  );
  return (opProp?.options ?? []) as OptionLike[];
}

describe('Quick description — n8n konvenciók', () => {
  it('a resource lista alfabetikusan rendezett (n8n-nodes-base/node-param-options-type-unsorted-items)', () => {
    const opts = (getResourceProp()?.options ?? []) as OptionLike[];
    const names = opts.map((o) => o.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('minden resource-on belül az operation lista alfabetikusan rendezett', () => {
    const resources = ((getResourceProp()?.options ?? []) as OptionLike[]).map((o) => o.value);
    for (const resource of resources) {
      const opts = getOperationsForResource(resource);
      const names = opts.map((o) => o.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    }
  });

  it('minden operation option-höz tartozik action mező (n8n-nodes-base/node-param-operation-without-action)', () => {
    const resources = ((getResourceProp()?.options ?? []) as OptionLike[]).map((o) => o.value);
    const offenders: string[] = [];
    for (const resource of resources) {
      const opts = getOperationsForResource(resource) as Array<{
        name: string;
        value: string;
        action?: string;
      }>;
      for (const op of opts) {
        if (!op.action) offenders.push(`${resource}/${op.value}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('credential típus tokenAuth (apiKey) — sehol nem hivatkozik OAuth-ra', () => {
    expect(JSON.stringify(node.description)).not.toMatch(/oauth/i);
  });

  it('a description szerkezete stabil — snapshot mentés', () => {
    // Mély snapshot az ujra-rendezésekre, eltüntetett opciókra és felesleges duplikációkra
    // azonnal jelez. A propertiket csak felszíni mezőkre szűrjük le, hogy a snapshot
    // ne legyen 1000+ soros minden mező-leírással — fókusz a strukturális stabilitáson.
    const summary = {
      name: node.description.name,
      displayName: node.description.displayName,
      version: node.description.version,
      icon: node.description.icon,
      credentials: node.description.credentials,
      resources: ((getResourceProp()?.options ?? []) as OptionLike[]).map((r) => ({
        value: r.value,
        operations: getOperationsForResource(r.value).map((o) => o.value),
      })),
    };
    expect(summary).toMatchSnapshot();
  });
});
