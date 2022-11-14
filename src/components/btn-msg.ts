// #region Imports

// Packages
import { ComponentType } from 'slash-create';

// Local
import { PatternComponent } from '../util/PatternComponent';
import { fetchFromGitHub, resolveMessage, memberHasRoles, parseFileContent } from '../util/common';

// #endregion

interface EncodedOptions {
  // options: ParsedUrlQuery;
  repo: string;
  branch: string;
  path: string;
  restrictions: string[];
}

function deconstructInput(input: string): EncodedOptions {
  const segments = input.split(/[:@#&]/g);
  const repo = segments[1];
  const branch = segments[2] ?? 'main';
  const path = segments[3] ?? 'README.md';
  const restrictions = segments.slice(4).filter((r) => r.length > 0);

  return { repo, branch, path, restrictions };
}

export default new PatternComponent('btn-msg')
  .withPattern(/^btn-msg:([^@\b]+)@([^#\b]+)#([a-zA-Z0-9_\-/]+\.(?:ya?ml|json|md))((?:&\d{17,19})*)?$/gm)
  .requireComponent(ComponentType.BUTTON)
  .withMethod(async (ctx) => {
    const { /* options, */ repo, branch, path, restrictions } = deconstructInput(ctx.customID);

    // Determine if the member has all the required roles from the custom ID

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
