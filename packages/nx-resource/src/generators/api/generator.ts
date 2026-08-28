// GitHub Copilot generated code - start
import {
  formatFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readJson,
  runTasksInSerial,
  Tree,
  updateJson,
} from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import { applicationGenerator as nodeApplicationGenerator } from '@nx/node';

import { ApiGeneratorSchema } from './schema';

const TEMPLATE_RESOURCE_NAME = 'knowledge-graph';
const TEMPLATE_FEATURE_NAME = 'ping';
const RESOURCE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FEATURE_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const SCOPE_PATTERN = /^@[a-z0-9][a-z0-9-]*$/;
const DEFAULT_VERSION = '0.0.1';

interface NormalizedOptions {
  resourceName: string;
  resourceNamePascal: string;
  featureName: string;
  featureNamePascal: string;
  scope: string;
  directory: string;
  apiPort: number;
  skipFormat: boolean;
  resourceRoot: string;
  templateRoot: string;
  apiProject: string;
  apiRoot: string;
  apiE2eProject: string;
  apiE2eRoot: string;
  modelsProject: string;
  modelsRoot: string;
}

interface ModelsState {
  packageJsonPath: string;
  indexPath: string;
  libraryPath: string;
  packageName: string;
  version: string;
  shouldCreate: boolean;
}

interface CopyInstruction {
  from: string;
  to: string;
}

export async function apiGenerator(
  tree: Tree,
  schema: ApiGeneratorSchema
): Promise<GeneratorCallback> {
  const options = normalizeOptions(schema);

  ensureCanonicalTemplateExists(tree, options);
  ensureApiProjectsDoNotExist(tree, options);
  ensureDeterministicWorkspaceConfig(tree);

  const modelsState = resolveModelsState(tree, options);
  const tasks: GeneratorCallback[] = [];

  await scaffoldBaseProjects(tree, options, modelsState, tasks);

  resetGeneratedSourceTrees(tree, options, modelsState);
  applyCanonicalTemplate(tree, options, modelsState);
  enforcePackageMetadata(tree, options, modelsState);

  if (!modelsState.shouldCreate) {
    ensureModelsFeatureContracts(tree, options, modelsState);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default apiGenerator;

function normalizeOptions(schema: ApiGeneratorSchema): NormalizedOptions {
  const resourceName = names(schema.name).fileName;
  if (!RESOURCE_NAME_PATTERN.test(resourceName)) {
    throw new Error(
      `The resource name must be kebab-case. Received "${schema.name}".`
    );
  }

  const featureName = names(schema.featureName ?? TEMPLATE_FEATURE_NAME).propertyName;
  if (!FEATURE_NAME_PATTERN.test(featureName)) {
    throw new Error(
      `The feature name must resolve to a valid camelCase identifier. Received "${schema.featureName}".`
    );
  }

  const rawScope = (schema.scope ?? '@org').trim();
  const scope = rawScope.startsWith('@') ? rawScope : `@${rawScope}`;
  if (!SCOPE_PATTERN.test(scope)) {
    throw new Error(`The scope must look like "@org". Received "${schema.scope}".`);
  }

  let directory = schema.directory ?? 'packages/resources';
  while (directory.endsWith('/')) {
    directory = directory.slice(0, -1);
  }

  const apiPort = normalizePort(schema.apiPort ?? 3000);
  const resourceRoot = joinPathFragments(directory, resourceName);
  const templateRoot = joinPathFragments(directory, TEMPLATE_RESOURCE_NAME);

  const apiProject = `${resourceName}-api`;
  const apiE2eProject = `${resourceName}-api-e2e`;
  const modelsProject = `${resourceName}-models`;

  return {
    resourceName,
    resourceNamePascal: names(resourceName).className,
    featureName,
    featureNamePascal: names(featureName).className,
    scope,
    directory,
    apiPort,
    skipFormat: schema.skipFormat ?? false,
    resourceRoot,
    templateRoot,
    apiProject,
    apiRoot: joinPathFragments(resourceRoot, apiProject),
    apiE2eProject,
    apiE2eRoot: joinPathFragments(resourceRoot, apiE2eProject),
    modelsProject,
    modelsRoot: joinPathFragments(resourceRoot, modelsProject),
  };
}

function normalizePort(value: number): number {
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`apiPort must be an integer between 1 and 65535. Received "${value}".`);
  }

  return value;
}

function ensureCanonicalTemplateExists(tree: Tree, options: NormalizedOptions): void {
  if (!tree.exists(options.templateRoot)) {
    throw new Error(
      [
        `Canonical template resource not found at "${options.templateRoot}".`,
        `This generator expects an existing "${TEMPLATE_RESOURCE_NAME}" resource as the deterministic source template.`,
      ].join(' ')
    );
  }
}

function ensureApiProjectsDoNotExist(tree: Tree, options: NormalizedOptions): void {
  const collidingPaths = [options.apiRoot, options.apiE2eRoot].filter((path) =>
    tree.exists(path)
  );

  if (collidingPaths.length === 0) {
    return;
  }

  throw new Error(
    [
      'Cannot scaffold api projects because these paths already exist:',
      collidingPaths.map((path) => `"${path}"`).join(', '),
    ].join(' ')
  );
}

function ensureDeterministicWorkspaceConfig(tree: Tree): void {
  updateJson(tree, 'package.json', (json) => {
    const current = Array.isArray(json.workspaces) ? json.workspaces : [];
    const filtered = current.filter(
      (entry: string) => entry !== 'packages/resources/knowledge-graph/*'
    );
    const next = new Set(filtered);
    next.add('packages/*');
    next.add('packages/resources/*/*');
    json.workspaces = Array.from(next);
    return json;
  });

  updateJson(tree, 'nx.json', (json) => {
    if (!Array.isArray(json.plugins)) {
      return json;
    }

    json.plugins = json.plugins.map((plugin: string | Record<string, unknown>) => {
      if (
        typeof plugin !== 'object' ||
        plugin?.['plugin'] !== '@nx/jest/plugin'
      ) {
        return plugin;
      }

      const existingExclude = Array.isArray(plugin['exclude'])
        ? (plugin['exclude'] as string[])
        : [];
      const normalized = existingExclude.filter(
        (entry) => entry !== 'packages/resources/knowledge-graph/knowledge-graph-api-e2e/**/*'
      );

      if (!normalized.includes('packages/resources/*/*-api-e2e/**/*')) {
        normalized.push('packages/resources/*/*-api-e2e/**/*');
      }

      return {
        ...plugin,
        exclude: normalized,
      };
    });

    return json;
  });
}

function resolveModelsState(tree: Tree, options: NormalizedOptions): ModelsState {
  const packageJsonPath = joinPathFragments(options.modelsRoot, 'package.json');
  const indexPath = joinPathFragments(options.modelsRoot, 'src/index.ts');
  const libraryPath = joinPathFragments(
    options.modelsRoot,
    'src/lib',
    `${options.resourceName}-models.ts`
  );

  if (!tree.exists(packageJsonPath)) {
    return {
      packageJsonPath,
      indexPath,
      libraryPath,
      packageName: toScopedPackageName(options.scope, options.modelsProject),
      version: DEFAULT_VERSION,
      shouldCreate: true,
    };
  }

  const packageJson = readJson(tree, packageJsonPath) as {
    name?: string;
    version?: string;
  };

  const packageName =
    typeof packageJson.name === 'string' && packageJson.name.trim().length > 0
      ? packageJson.name
      : toScopedPackageName(options.scope, options.modelsProject);
  const version =
    typeof packageJson.version === 'string' && packageJson.version.trim().length > 0
      ? packageJson.version
      : DEFAULT_VERSION;

  return {
    packageJsonPath,
    indexPath,
    libraryPath,
    packageName,
    version,
    shouldCreate: false,
  };
}

async function scaffoldBaseProjects(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState,
  tasks: GeneratorCallback[]
): Promise<void> {
  pushTask(
    tasks,
    await nodeApplicationGenerator(tree, {
      directory: options.apiRoot,
      name: options.apiProject,
      framework: 'express',
      bundler: 'esbuild',
      linter: 'eslint',
      unitTestRunner: 'jest',
      e2eTestRunner: 'jest',
      docker: true,
      port: options.apiPort,
      useProjectJson: false,
      skipFormat: true,
    })
  );

  if (modelsState.shouldCreate) {
    pushTask(
      tasks,
      await jsLibraryGenerator(tree, {
        directory: options.modelsRoot,
        name: options.modelsProject,
        bundler: 'tsc',
        linter: 'eslint',
        unitTestRunner: 'none',
        publishable: true,
        importPath: toScopedPackageName(options.scope, options.modelsProject),
        useProjectJson: false,
        skipFormat: true,
      })
    );
  }
}

function resetGeneratedSourceTrees(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  removePathRecursively(tree, joinPathFragments(options.apiRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.apiE2eRoot, 'src'));

  if (modelsState.shouldCreate) {
    removePathRecursively(tree, joinPathFragments(options.modelsRoot, 'src'));
  }

  deleteIfExists(tree, joinPathFragments(options.apiRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.apiRoot, 'jest.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.apiE2eRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.apiE2eRoot, 'jest.config.cts'));
}

function applyCanonicalTemplate(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  const replacements = buildReplacements(options, modelsState);
  const instructions = getCanonicalTemplateInstructions(options, modelsState);

  for (const instruction of instructions) {
    const sourcePath = joinPathFragments(options.templateRoot, instruction.from);
    const targetPath = joinPathFragments(options.resourceRoot, instruction.to);

    const raw = tree.read(sourcePath, 'utf-8');
    if (raw === null) {
      throw new Error(
        `Missing canonical template file "${sourcePath}". Cannot scaffold deterministically.`
      );
    }

    tree.write(targetPath, applyReplacements(raw, replacements));
  }
}

function getCanonicalTemplateInstructions(
  options: NormalizedOptions,
  modelsState: ModelsState
): CopyInstruction[] {
  const instructions: CopyInstruction[] = [
    { from: 'knowledge-graph-api/.spec.swcrc', to: `${options.apiProject}/.spec.swcrc` },
    { from: 'knowledge-graph-api/Dockerfile', to: `${options.apiProject}/Dockerfile` },
    { from: 'knowledge-graph-api/eslint.config.mjs', to: `${options.apiProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-api/jest.config.cjs', to: `${options.apiProject}/jest.config.cjs` },
    { from: 'knowledge-graph-api/package.json', to: `${options.apiProject}/package.json` },
    { from: 'knowledge-graph-api/tsconfig.app.json', to: `${options.apiProject}/tsconfig.app.json` },
    { from: 'knowledge-graph-api/tsconfig.json', to: `${options.apiProject}/tsconfig.json` },
    { from: 'knowledge-graph-api/tsconfig.spec.json', to: `${options.apiProject}/tsconfig.spec.json` },
    { from: 'knowledge-graph-api/src/app.ts', to: `${options.apiProject}/src/app.ts` },
    { from: 'knowledge-graph-api/src/main.ts', to: `${options.apiProject}/src/main.ts` },
    { from: 'knowledge-graph-api/src/assets/.gitkeep', to: `${options.apiProject}/src/assets/.gitkeep` },
    { from: 'knowledge-graph-api/src/features/repository.ts', to: `${options.apiProject}/src/features/repository.ts` },
    {
      from: 'knowledge-graph-api/src/features/ping/controller.ts',
      to: `${options.apiProject}/src/features/${options.featureName}/controller.ts`,
    },
    {
      from: 'knowledge-graph-api/src/features/ping/service.ts',
      to: `${options.apiProject}/src/features/${options.featureName}/service.ts`,
    },
    {
      from: 'knowledge-graph-api/src/features/ping/test.spec.ts',
      to: `${options.apiProject}/src/features/${options.featureName}/test.spec.ts`,
    },
    { from: 'knowledge-graph-api/src/shared/runtime.ts', to: `${options.apiProject}/src/shared/runtime.ts` },

    { from: 'knowledge-graph-api-e2e/.spec.swcrc', to: `${options.apiE2eProject}/.spec.swcrc` },
    { from: 'knowledge-graph-api-e2e/eslint.config.mjs', to: `${options.apiE2eProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-api-e2e/jest.config.cjs', to: `${options.apiE2eProject}/jest.config.cjs` },
    { from: 'knowledge-graph-api-e2e/package.json', to: `${options.apiE2eProject}/package.json` },
    { from: 'knowledge-graph-api-e2e/tsconfig.json', to: `${options.apiE2eProject}/tsconfig.json` },
    {
      from: 'knowledge-graph-api-e2e/src/knowledge-graph-api/knowledge-graph-api.spec.ts',
      to: `${options.apiE2eProject}/src/${options.apiProject}/${options.apiProject}.spec.ts`,
    },
    {
      from: 'knowledge-graph-api-e2e/src/support/global-setup.ts',
      to: `${options.apiE2eProject}/src/support/global-setup.ts`,
    },
    {
      from: 'knowledge-graph-api-e2e/src/support/global-teardown.ts',
      to: `${options.apiE2eProject}/src/support/global-teardown.ts`,
    },
    {
      from: 'knowledge-graph-api-e2e/src/support/test-setup.ts',
      to: `${options.apiE2eProject}/src/support/test-setup.ts`,
    },
  ];

  if (modelsState.shouldCreate) {
    instructions.push(
      { from: 'knowledge-graph-models/eslint.config.mjs', to: `${options.modelsProject}/eslint.config.mjs` },
      { from: 'knowledge-graph-models/package.json', to: `${options.modelsProject}/package.json` },
      { from: 'knowledge-graph-models/README.md', to: `${options.modelsProject}/README.md` },
      { from: 'knowledge-graph-models/tsconfig.json', to: `${options.modelsProject}/tsconfig.json` },
      { from: 'knowledge-graph-models/tsconfig.lib.json', to: `${options.modelsProject}/tsconfig.lib.json` },
      { from: 'knowledge-graph-models/src/index.ts', to: `${options.modelsProject}/src/index.ts` },
      {
        from: 'knowledge-graph-models/src/lib/knowledge-graph-models.ts',
        to: `${options.modelsProject}/src/lib/${options.resourceName}-models.ts`,
      }
    );
  }

  return instructions;
}

function buildReplacements(
  options: NormalizedOptions,
  modelsState: ModelsState
): Array<readonly [string, string]> {
  const apiPackageName = toScopedPackageName(options.scope, options.apiProject);
  const apiE2ePackageName = toScopedPackageName(options.scope, options.apiE2eProject);

  const replacements: Array<readonly [string, string]> = [
    ['@dev-portal/knowledge-graph-models', modelsState.packageName],
    ['@org/knowledge-graph-models', modelsState.packageName],
    ['@org/knowledge-graph-api-e2e', apiE2ePackageName],
    ['@org/knowledge-graph-api', apiPackageName],
    ['knowledge-graph-api-e2e', options.apiE2eProject],
    ['knowledge-graph-api', options.apiProject],
    ['knowledge-graph-models', options.modelsProject],
    ['jest.config.cts', 'jest.config.cjs'],
    ['KnowledgeGraph', options.resourceNamePascal],
    ['Ping', options.featureNamePascal],
    ['ping', options.featureName],
    ['knowledge-graph', options.resourceName],
  ];

  if (options.apiPort !== 3000) {
    replacements.push(['3000', `${options.apiPort}`]);
  }

  return replacements.sort((left, right) => right[0].length - left[0].length);
}

function applyReplacements(
  source: string,
  replacements: Array<readonly [string, string]>
): string {
  let output = source;
  for (const [from, to] of replacements) {
    output = replaceAllLiteral(output, from, to);
  }
  return output;
}

function replaceAllLiteral(source: string, find: string, replace: string): string {
  return source.split(find).join(replace);
}

function enforcePackageMetadata(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  const expressVersion = getRootDependencyVersion(tree, 'express', '^5.1.0');
  const tslibVersion = getRootDependencyVersion(tree, 'tslib', '^2.3.0');
  const zodVersion = getRootDependencyVersion(tree, 'zod', '^4.4.3');
  const modelsDependencyVersion = normalizeDependencyRange(modelsState.version);

  updateJson(tree, joinPathFragments(options.apiRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.apiProject);
    json.version = DEFAULT_VERSION;
    json.private = true;
    json.nx ??= {};
    json.nx.name = options.apiProject;
    json.dependencies = sortRecord({
      [modelsState.packageName]: modelsDependencyVersion,
      express: expressVersion,
    });
    return json;
  });

  updateJson(tree, joinPathFragments(options.apiE2eRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.apiE2eProject);
    json.version = DEFAULT_VERSION;
    json.private = true;
    json.nx ??= {};
    json.nx.name = options.apiE2eProject;
    json.nx.implicitDependencies = [options.apiProject];
    json.nx.targets ??= {};
    json.nx.targets.e2e ??= {};
    json.nx.targets.e2e.dependsOn = [
      `${options.apiProject}:build`,
      `${options.apiProject}:serve`,
    ];
    json.nx.targets.e2e.options ??= {};
    json.nx.targets.e2e.options.jestConfig = joinPathFragments(
      options.apiE2eRoot,
      'jest.config.cjs'
    );
    json.nx.targets.e2e.options.passWithNoTests = true;
    return json;
  });

  updateJson(tree, modelsState.packageJsonPath, (json) => {
    if (modelsState.shouldCreate) {
      json.name = modelsState.packageName;
      json.version = DEFAULT_VERSION;
      json.private = true;
      json.type = 'module';
      json.main = './dist/index.js';
      json.module = './dist/index.js';
      json.types = './dist/index.d.ts';
      json.exports = {
        './package.json': './package.json',
        '.': {
          '@org/source': './src/index.ts',
          types: './dist/index.d.ts',
          import: './dist/index.js',
          default: './dist/index.js',
        },
      };
      json.nx ??= {};
      json.nx.name = options.modelsProject;
      json.dependencies = sortRecord({
        tslib: tslibVersion,
        zod: zodVersion,
      });
      return json;
    }

    if (typeof json.name !== 'string' || json.name.trim().length === 0) {
      json.name = modelsState.packageName;
    }
    if (typeof json.version !== 'string' || json.version.trim().length === 0) {
      json.version = DEFAULT_VERSION;
    }

    json.nx = ensureNxName(json.nx, options.modelsProject);

    const dependencies = toRecord(json.dependencies);
    if (!dependencies.tslib) {
      dependencies.tslib = tslibVersion;
    }
    if (!dependencies.zod) {
      dependencies.zod = zodVersion;
    }
    json.dependencies = sortRecord(dependencies);

    return json;
  });
}

function normalizeDependencyRange(version: string): string {
  if (version.startsWith('workspace:') || version.startsWith('file:')) {
    return version;
  }

  if (version.startsWith('^') || version.startsWith('~')) {
    return version;
  }

  return `^${version}`;
}

function ensureModelsFeatureContracts(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  ensureModelsIndexExport(tree, options, modelsState);
  ensureModelsLibraryContainsFeatureContracts(tree, options, modelsState);
}

function ensureModelsIndexExport(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  const expectedExport = `export * from './lib/${options.resourceName}-models.js';`;
  const existing = tree.read(modelsState.indexPath, 'utf-8');

  if (existing === null) {
    tree.write(modelsState.indexPath, `${expectedExport}\n`);
    return;
  }

  if (existing.includes(expectedExport)) {
    return;
  }

  const trimmed = trimTrailingWhitespace(existing);
  const next = trimmed.length === 0 ? expectedExport : `${trimmed}\n\n${expectedExport}`;
  tree.write(modelsState.indexPath, `${next}\n`);
}

function ensureModelsLibraryContainsFeatureContracts(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsState
): void {
  const existing = tree.read(modelsState.libraryPath, 'utf-8');
  if (existing === null) {
    tree.write(modelsState.libraryPath, buildDefaultModelsSource(options));
    return;
  }

  const requestSchemaName = `${options.featureName}RequestSchema`;
  const responseSchemaName = `${options.featureName}ResponseSchema`;
  const requestTypeName = `${options.featureNamePascal}Request`;
  const responseTypeName = `${options.featureNamePascal}Response`;

  const hasRequestSchema = existing.includes(`export const ${requestSchemaName}`);
  const hasResponseSchema = existing.includes(`export const ${responseSchemaName}`);

  if (hasRequestSchema && hasResponseSchema) {
    return;
  }

  let output = existing;
  if (!/from ['"]zod['"]/.test(output)) {
    output = `import { z } from 'zod';\n\n${output}`;
  }

  const additions: string[] = [];

  if (!hasRequestSchema) {
    additions.push(
      [
        `export const ${requestSchemaName} = z.object({`,
        '  query: z.object({}).passthrough(),',
        '});',
        '',
        `export type ${requestTypeName} = z.infer<typeof ${requestSchemaName}>;`,
      ].join('\n')
    );
  }

  if (!hasResponseSchema) {
    additions.push(
      [
        `export const ${responseSchemaName} = z.object({`,
        "  status: z.literal('ok'),",
        '  checkedAt: z.string().datetime({ offset: false }),',
        '  uptimeSeconds: z.number().int().nonnegative(),',
        '});',
        '',
        `export type ${responseTypeName} = z.infer<typeof ${responseSchemaName}>;`,
      ].join('\n')
    );
  }

  output = `${trimTrailingWhitespace(output)}\n\n${additions.join('\n\n')}\n`;
  tree.write(modelsState.libraryPath, output);
}

function buildDefaultModelsSource(options: NormalizedOptions): string {
  const requestSchemaName = `${options.featureName}RequestSchema`;
  const responseSchemaName = `${options.featureName}ResponseSchema`;
  const requestTypeName = `${options.featureNamePascal}Request`;
  const responseTypeName = `${options.featureNamePascal}Response`;

  return [
    "import { z } from 'zod';",
    '',
    '// GitHub Copilot generated code - start',
    `export const ${requestSchemaName} = z.object({`,
    '  query: z.object({}).passthrough(),',
    '});',
    '',
    `export type ${requestTypeName} = z.infer<typeof ${requestSchemaName}>;`,
    '',
    `export const ${responseSchemaName} = z.object({`,
    "  status: z.literal('ok'),",
    '  checkedAt: z.string().datetime({ offset: false }),',
    '  uptimeSeconds: z.number().int().nonnegative(),',
    '});',
    '',
    `export type ${responseTypeName} = z.infer<typeof ${responseSchemaName}>;`,
    '// GitHub Copilot generated code - end',
    '',
  ].join('\n');
}

function getRootDependencyVersion(
  tree: Tree,
  dependencyName: string,
  fallback: string
): string {
  const rootPackageJson = readJson(tree, 'package.json') as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return (
    rootPackageJson.dependencies?.[dependencyName] ??
    rootPackageJson.devDependencies?.[dependencyName] ??
    fallback
  );
}

function ensureNxName(nxValue: unknown, fallbackName: string): Record<string, unknown> {
  const nx =
    typeof nxValue === 'object' && nxValue !== null && !Array.isArray(nxValue)
      ? { ...(nxValue as Record<string, unknown>) }
      : {};

  if (typeof nx.name !== 'string' || nx.name.trim().length === 0) {
    nx.name = fallbackName;
  }

  return nx;
}

function toRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') {
      output[key] = item;
    }
  }

  return output;
}

function sortRecord(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right))
  );
}

function toScopedPackageName(scope: string, name: string): string {
  return `${scope}/${name}`;
}

function trimTrailingWhitespace(value: string): string {
  return value.trimEnd();
}

function pushTask(tasks: GeneratorCallback[], task?: GeneratorCallback): void {
  if (task) {
    tasks.push(task);
  }
}

function deleteIfExists(tree: Tree, path: string): void {
  if (tree.exists(path)) {
    tree.delete(path);
  }
}

function removePathRecursively(tree: Tree, path: string): void {
  if (!tree.exists(path)) {
    return;
  }

  try {
    const children = tree.children(path);
    for (const child of children) {
      removePathRecursively(tree, joinPathFragments(path, child));
    }
  } catch {
    // If path is a file, tree.children throws.
  }

  if (tree.exists(path)) {
    tree.delete(path);
  }
}
// GitHub Copilot generated code - end