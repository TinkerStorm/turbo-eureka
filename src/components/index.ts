// #region Imports

// Packages
import { SlashCreator } from 'slash-create';

// Local - Components
import btnRole from './btn-role';
import btnMsg from './btn-msg';
import dud from './dud';
import pickRole from './pick-role';
import pickMsg from './pick-msg';

// Local - Event Handlers
import componentInteractionEvent from '../events/componentInteraction';

// #endregion

const components = [btnRole, pickRole, btnMsg, pickMsg, dud];

export function registerListener(creator: SlashCreator) {
  components.forEach((component) => component.register());

  creator.on('componentInteraction', componentInteractionEvent);
}
