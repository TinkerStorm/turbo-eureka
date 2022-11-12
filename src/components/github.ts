import yaml from 'js-yaml';
import grayMatter from 'gray-matter';

import { PatternComponent } from '../util/PatternComponent';
import { ComponentType } from 'slash-create';

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

function parseFileContent(input: string, fileType: string) {
  switch (fileType) {
    // Future support for gray-matter on channel-backup?
    case 'md': {
      const result = grayMatter(input);

      return { ...result.data, content: result.content };
    }
    case 'json':
      return JSON.parse(input);
    case 'yaml':
    case 'yml':
      return yaml.load(input);
  }
}

export default new PatternComponent('github')
  .withPattern(/^github:([^@\b]+)@([^#\b]+)#([a-zA-Z0-9_\-/]+\.(?:ya?ml|json|md))((?:&\d{17,19})*)?$/gm)
  .requireComponent(ComponentType.BUTTON)
  .withMethod(async (ctx) => {
    const { /* options, */ repo, branch, path, restrictions } = deconstructInput(ctx.customID);

    console.log(repo, branch, path, restrictions);

    // Determine if the member has all the required roles from the custom ID
    const hasAllRoles = restrictions.every((role) => ctx.member.roles.includes(role));

    if (restrictions.length > 0 && !hasAllRoles) {
      console.log(
        'Missing roles',
        restrictions.filter((role) => !ctx.member.roles.includes(role))
      );

      return {
        content: 'You do not have the required roles to select this option.',
        ephemeral: true
      };
    }

    console.log('Fetching file...', `https://raw.githubusercontent.com/${repo}/${branch}/${path}`);

    // Fetch the file from GitHub
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${path}`);

    if (!response.ok) {
      return {
        content: 'Failed to fetch file from GitHub.',
        ephemeral: true
      };
    }

    console.log('Parsing file...');

    const fileContent = await response.text();
    const fileType = path.split('.').pop();

    const parsedContent = parseFileContent(fileContent, fileType);

    console.log(parsedContent);

    return {
      ...parsedContent,
      ephemeral: true
      // ...(options.ephemeral && {
      //  ephemeral: options.ephemeral === 'true'
      // })
    };
  });
