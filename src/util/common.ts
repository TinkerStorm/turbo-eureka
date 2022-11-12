import { AnyComponent, ComponentActionRow, ComponentButton, ComponentSelectMenu, ComponentType } from 'slash-create';

export function findComponent<T extends ComponentButton | ComponentSelectMenu>(
  components: AnyComponent[],
  id: string
): T | undefined {
  const [rowIndex, componentIndex] = findComponentPosition(components, id);

  if (rowIndex === -1 || componentIndex === -1) return undefined;

  return (components[rowIndex] as ComponentActionRow).components[componentIndex] as T;
}

export function findComponentPosition(components: AnyComponent[], id: string): [number, number] | undefined {
  for (let i = 0; i < components.length; i++) {
    const row = components[i];
    if (row.type !== ComponentType.ACTION_ROW) continue;
    for (let j = 0; j < row.components.length; j++) {
      const component = row.components[j];
      if ('url' in component) return;
      if (component.type === ComponentType.TEXT_INPUT) return;
      if (![ComponentType.BUTTON, ComponentType.STRING_SELECT].includes(component.type)) return;
      if (component.custom_id.startsWith(id)) {
        return [i, j];
      }
    }
  }
}

export function shiftIf<T>(arr: T[], condition: (item: T) => boolean = () => true, shift: number = 0): T {
  const index = arr.findIndex(condition);
  if (index >= 0) {
    return arr.splice(index + shift, 0)[0];
  }
  return undefined;
}
