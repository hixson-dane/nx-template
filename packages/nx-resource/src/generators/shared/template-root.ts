// GitHub Copilot generated code - start
import { joinPathFragments, Tree } from '@nx/devkit';

const EMBEDDED_TEMPLATE_BASE = joinPathFragments(
  'packages',
  'nx-resource',
  'templates'
);

export function resolveTemplateRoot(
  templateRootOverride: string | undefined,
  templateResourceName: string
): string {
  const override = templateRootOverride?.trim();
  if (override && override.length > 0) {
    return trimTrailingSlash(override);
  }

  return joinPathFragments(EMBEDDED_TEMPLATE_BASE, templateResourceName);
}

export function ensureTemplateRootExists(
  tree: Tree,
  templateRoot: string,
  templateResourceName: string
): void {
  if (tree.exists(templateRoot)) {
    return;
  }

  throw new Error(
    [
      `Canonical template resource not found at "${templateRoot}".`,
      `Expected an embedded "${templateResourceName}" template under "${EMBEDDED_TEMPLATE_BASE}"`,
      'or pass --templateRoot to use a custom template location.',
    ].join(' ')
  );
}

function trimTrailingSlash(value: string): string {
  let output = value;

  while (output.endsWith('/')) {
    output = output.slice(0, -1);
  }

  return output;
}
// GitHub Copilot generated code - end
