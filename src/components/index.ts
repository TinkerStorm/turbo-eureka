import { SlashCreator } from 'slash-create';

import buttonRole from './button-role';
import github from './github';
import selectMenu from './select-menu';

const components = [buttonRole, selectMenu, github];

export function registerListener(creator: SlashCreator) {
  components.forEach((component) => component.register(creator));
}
