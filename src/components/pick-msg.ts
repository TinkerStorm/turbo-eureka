// #region Imports

// Packages
import { ComponentContext, ComponentType } from 'slash-create';

// Local
import { PatternComponent } from '../util/PatternComponent';
import { fetchFromGitHub, resolveMessage, memberHasRoles, parseFileContent } from '../util/common';

// #endregion

function deconstructInput(input: string) {
  const segments = input.split(/[:@#&]/g);

  const repo = segments[0];
  const branch = segments[1] ?? 'main';
  const path = segments[2] ?? 'README.md';

  return { repo, branch, path };
}

/**
 * Despite allowing for multiple values, this component will only support the first value it finds.
 * This is because only one message can be returned to Discord at a time.
 * > Merging of message payloads is *possible*, but risky at best given the limits imposed on the response.
 */
export default new PatternComponent('pick-msg')
  .requireComponent(ComponentType.STRING_SELECT)
  .withPattern(/^pick-msg((?:&\d{17,21})*)$/gm)
  .withMethod(async (ctx: ComponentContext) => {
    const [picked] = ctx.values;

    if (!picked) {
      ctx.acknowledge();
      return;
    }

    const { repo, branch, path } = deconstructInput(picked);
    const restrictions = ctx.customID.split(/[&]/g).slice(1);

    if (!memberHasRoles(ctx.member, restrictions)) {
      return {
        content: 'You do not have the required roles to select this option.',
        ephemeral: true
      };
    }

    // Fetch the file from GitHub
    const response = await fetchFromGitHub(repo, branch, path);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from GitHub (\`${repo}/${branch}/${path}\`): ${response.status} ${response.statusText}`
      );
    }

    const fileContent = await response.text();
    const fileType = path.split('.').pop();

    const parsedMessage = parseFileContent(fileContent, fileType);

    return resolveMessage(ctx, parsedMessage);
  });
