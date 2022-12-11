// #region Imports

// Node
import { parse as qsParse } from 'querystring';

// Packages
import { ComponentActionRow, ComponentSelectMenu, ComponentType, MessageOptions } from 'slash-create';
import { findComponent, findComponentPosition } from '../util/common';

// Local
import { PatternComponent } from '../util/PatternComponent';

// #endregion

function deconstructInput(input: string) {
  const [, identifier, stringOptions] = input.split(/[:?]/g);

  const parsedOptions = qsParse(stringOptions);

  return {
    identifier,
    debug: ['', 'true', '1'].includes(parsedOptions.debug?.toString().toLowerCase())
  };
}

export default new PatternComponent('dud')
  .withPattern(/^dud(?::?[$&\w]*)?(?:\?[\w_]*)?/)
  .withLogHook((ctx) => ({
    ...deconstructInput(ctx.customID),
    type: ComponentType[ctx.componentType],
    ...(ctx.values && { values: ctx.values })
  }))
  .withMethod(async (ctx) => {
    const { identifier, debug } = deconstructInput(ctx.customID);
    const [row, column] = findComponentPosition(ctx.message.components, ctx.customID);
    const component = findComponent(ctx.message.components, ctx.customID);

    let response: MessageOptions;

    if (debug) {
      response = {
        embeds: [
          {
            title: `Debugging for \`${identifier}\` on ${ComponentType[component.type]}`,
            description: [
              `**Row**: ${row} (Max 5)`,
              `**Column**: ${column} (Max ${ctx.componentType === ComponentType.BUTTON ? 5 : 1})`,
              `**Custom ID:** \`${component.custom_id}\`\n`
            ].join('\n'),
            fields: []
          }
        ]
      };

      const resolvedData = ctx.values.map((struct) => {
        const { emoji, label, value, description } = (component as ComponentSelectMenu).options.find(
          (option) => option.value === struct
        );

        const emojiString = (emoji?.id ? `<:${emoji.name}:${emoji.id}>` : emoji?.name) ?? '';
        const collection = [ctx.channels, ctx.users, ctx.roles].find((list) => list.has(struct));
        const display: string = collection?.get(struct)?.toString() ?? `${label} (${value})`.trim();
        return `${emojiString} ${display} ${description ? '\n> ' + description : ''}`.trim();
      });

      // if data is available, certain to be a select menu of some kind
      if (resolvedData.length > 0) {
        const select = component as ComponentSelectMenu;

        response.embeds[0].fields.push({
          name: 'Resolved Data',
          value: resolvedData.join('\n') || 'None'
        });

        response.embeds[0].description += [
          select.min_values && `**Min Values:** ${select.min_values}`,
          select.max_values && `**Max Values:** ${select.max_values}`,
          select.placeholder && `**Placeholder:** ${select.placeholder}`
        ]
          .filter(Boolean)
          .join('\n');
      }
    }

    return response ? { ...response, ephemeral: true } : null;
  });
