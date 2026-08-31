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
import { applicationGenerator as reactApplicationGenerator } from '@nx/react';

import { ResourceGeneratorSchema } from './schema';
import {
  ensureTemplateRootExists,
  resolveTemplateRoot,
} from '../shared/template-root';

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
  uiPort: number;
  skipFormat: boolean;
  resourceRoot: string;
  templateRoot: string;
  apiProject: string;
  apiRoot: string;
  apiE2eProject: string;
  apiE2eRoot: string;
  modelsProject: string;
  modelsRoot: string;
  sdkProject: string;
  sdkRoot: string;
  uiProject: string;
  uiRoot: string;
  uiE2eProject: string;
  uiE2eRoot: string;
}

interface CopyInstruction {
  from: string;
  to: string;
}

export async function resourceGenerator(
  tree: Tree,
  schema: ResourceGeneratorSchema
): Promise<GeneratorCallback> {
  const options = normalizeOptions(schema);
  ensureResourceDoesNotExist(tree, options);
  ensureCanonicalTemplateExists(tree, options);
  ensureDeterministicWorkspaceConfig(tree);

  const tasks: GeneratorCallback[] = [];
  await scaffoldBaseProjects(tree, options, tasks);

  resetGeneratedSourceTrees(tree, options);
  applyCanonicalTemplate(tree, options);
  enforcePackageMetadata(tree, options);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default resourceGenerator;

function normalizeOptions(schema: ResourceGeneratorSchema): NormalizedOptions {
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
    throw new Error(
      `The scope must look like "@org". Received "${schema.scope}".`
    );
  }

  let directory = schema.directory ?? 'packages/resources';
  while (directory.endsWith('/')) {
    directory = directory.slice(0, -1);
  }
  const apiPort = normalizePort(schema.apiPort ?? 3000, 'apiPort');
  const uiPort = normalizePort(schema.uiPort ?? 4200, 'uiPort');

  const resourceRoot = joinPathFragments(directory, resourceName);
  const templateRoot = resolveTemplateRoot(
    schema.templateRoot,
    TEMPLATE_RESOURCE_NAME
  );

  const apiProject = `${resourceName}-api`;
  const apiE2eProject = `${resourceName}-api-e2e`;
  const modelsProject = `${resourceName}-models`;
  const sdkProject = `${resourceName}-sdk`;
  const uiProject = `${resourceName}-ui`;
  const uiE2eProject = `${resourceName}-ui-e2e`;

  return {
    resourceName,
    resourceNamePascal: names(resourceName).className,
    featureName,
    featureNamePascal: names(featureName).className,
    scope,
    directory,
    apiPort,
    uiPort,
    skipFormat: schema.skipFormat ?? false,
    resourceRoot,
    templateRoot,
    apiProject,
    apiRoot: joinPathFragments(resourceRoot, apiProject),
    apiE2eProject,
    apiE2eRoot: joinPathFragments(resourceRoot, apiE2eProject),
    modelsProject,
    modelsRoot: joinPathFragments(resourceRoot, modelsProject),
    sdkProject,
    sdkRoot: joinPathFragments(resourceRoot, sdkProject),
    uiProject,
    uiRoot: joinPathFragments(resourceRoot, uiProject),
    uiE2eProject,
    uiE2eRoot: joinPathFragments(resourceRoot, uiE2eProject),
  };
}

function normalizePort(value: number, fieldName: 'apiPort' | 'uiPort'): number {
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(
      `${fieldName} must be an integer between 1 and 65535. Received "${value}".`
    );
  }

  return value;
}

function ensureResourceDoesNotExist(tree: Tree, options: NormalizedOptions): void {
  if (tree.exists(options.resourceRoot)) {
    throw new Error(
      `A resource already exists at "${options.resourceRoot}". Pick a different name.`
    );
  }
}

function ensureCanonicalTemplateExists(tree: Tree, options: NormalizedOptions): void {
  ensureTemplateRootExists(tree, options.templateRoot, TEMPLATE_RESOURCE_NAME);
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

    const resourceApiE2ePattern =
      /^packages\/resources\/[^/]+\/[^/]+-api-e2e\/\*\*\/\*$/;

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
        (entry) =>
          entry !== 'packages/resources/knowledge-graph/knowledge-graph-api-e2e/**/*' &&
          !resourceApiE2ePattern.test(entry)
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

async function scaffoldBaseProjects(
  tree: Tree,
  options: NormalizedOptions,
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

  pushTask(
    tasks,
    await jsLibraryGenerator(tree, {
      directory: options.sdkRoot,
      name: options.sdkProject,
      bundler: 'rollup',
      linter: 'eslint',
      unitTestRunner: 'jest',
      testEnvironment: 'node',
      publishable: true,
      importPath: toScopedPackageName(options.scope, options.sdkProject),
      useProjectJson: false,
      skipFormat: true,
    })
  );

  pushTask(
    tasks,
    await reactApplicationGenerator(tree, {
      directory: options.uiRoot,
      name: options.uiProject,
      bundler: 'vite',
      compiler: 'babel',
      style: 'css',
      linter: 'eslint',
      unitTestRunner: 'jest',
      e2eTestRunner: 'playwright',
      port: options.uiPort,
      useProjectJson: false,
      skipFormat: true,
    })
  );
}

function resetGeneratedSourceTrees(tree: Tree, options: NormalizedOptions): void {
  removePathRecursively(tree, joinPathFragments(options.apiRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.apiE2eRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.modelsRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.sdkRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.uiRoot, 'src'));
  removePathRecursively(tree, joinPathFragments(options.uiE2eRoot, 'src'));

  deleteIfExists(tree, joinPathFragments(options.apiRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.apiRoot, 'jest.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.apiE2eRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.apiE2eRoot, 'jest.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.sdkRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.sdkRoot, 'jest.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.uiRoot, 'jest.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.uiRoot, 'jest.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.uiRoot, 'jest.config.cjs'));

  deleteIfExists(tree, joinPathFragments(options.uiRoot, 'vite.config.ts'));
  deleteIfExists(tree, joinPathFragments(options.uiRoot, 'vite.config.cts'));
  deleteIfExists(tree, joinPathFragments(options.uiE2eRoot, 'playwright.config.ts'));
}

function applyCanonicalTemplate(tree: Tree, options: NormalizedOptions): void {
  const replacements = buildReplacements(options);
  const instructions = getCanonicalTemplateInstructions(options);

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
  options: NormalizedOptions
): CopyInstruction[] {
  return [
    { from: 'knowledge-graph-api/.spec.swcrc', to: `${options.apiProject}/.spec.swcrc` },
    { from: 'knowledge-graph-api/Dockerfile', to: `${options.apiProject}/Dockerfile` },
    { from: 'knowledge-graph-api/eslint.config.mjs', to: `${options.apiProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-api/jest.config.cjs', to: `${options.apiProject}/jest.config.cjs` },
    { from: 'knowledge-graph-api/package.template.json', to: `${options.apiProject}/package.json` },
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
    { from: 'knowledge-graph-api-e2e/package.template.json', to: `${options.apiE2eProject}/package.json` },
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

    { from: 'knowledge-graph-models/eslint.config.mjs', to: `${options.modelsProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-models/package.template.json', to: `${options.modelsProject}/package.json` },
    { from: 'knowledge-graph-models/README.md', to: `${options.modelsProject}/README.md` },
    { from: 'knowledge-graph-models/tsconfig.json', to: `${options.modelsProject}/tsconfig.json` },
    { from: 'knowledge-graph-models/tsconfig.lib.json', to: `${options.modelsProject}/tsconfig.lib.json` },
    { from: 'knowledge-graph-models/src/index.ts', to: `${options.modelsProject}/src/index.ts` },
    {
      from: 'knowledge-graph-models/src/lib/knowledge-graph-models.ts',
      to: `${options.modelsProject}/src/lib/${options.resourceName}-models.ts`,
    },

    { from: 'knowledge-graph-sdk/.spec.swcrc', to: `${options.sdkProject}/.spec.swcrc` },
    { from: 'knowledge-graph-sdk/.swcrc', to: `${options.sdkProject}/.swcrc` },
    { from: 'knowledge-graph-sdk/eslint.config.mjs', to: `${options.sdkProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-sdk/jest.config.cjs', to: `${options.sdkProject}/jest.config.cjs` },
    { from: 'knowledge-graph-sdk/package.template.json', to: `${options.sdkProject}/package.json` },
    { from: 'knowledge-graph-sdk/README.md', to: `${options.sdkProject}/README.md` },
    { from: 'knowledge-graph-sdk/rollup.config.cjs', to: `${options.sdkProject}/rollup.config.cjs` },
    { from: 'knowledge-graph-sdk/tsconfig.json', to: `${options.sdkProject}/tsconfig.json` },
    { from: 'knowledge-graph-sdk/tsconfig.lib.json', to: `${options.sdkProject}/tsconfig.lib.json` },
    { from: 'knowledge-graph-sdk/tsconfig.spec.json', to: `${options.sdkProject}/tsconfig.spec.json` },
    { from: 'knowledge-graph-sdk/src/index.ts', to: `${options.sdkProject}/src/index.ts` },
    {
      from: 'knowledge-graph-sdk/src/features/ping/index.ts',
      to: `${options.sdkProject}/src/features/${options.featureName}/index.ts`,
    },
    {
      from: 'knowledge-graph-sdk/src/features/ping/models.ts',
      to: `${options.sdkProject}/src/features/${options.featureName}/models.ts`,
    },
    {
      from: 'knowledge-graph-sdk/src/features/ping/test.ts',
      to: `${options.sdkProject}/src/features/${options.featureName}/test.ts`,
    },

    { from: 'knowledge-graph-ui/eslint.config.mjs', to: `${options.uiProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-ui/index.html', to: `${options.uiProject}/index.html` },
    { from: 'knowledge-graph-ui/jest.config.cts', to: `${options.uiProject}/jest.config.cjs` },
    { from: 'knowledge-graph-ui/package.template.json', to: `${options.uiProject}/package.json` },
    { from: 'knowledge-graph-ui/tsconfig.app.json', to: `${options.uiProject}/tsconfig.app.json` },
    { from: 'knowledge-graph-ui/tsconfig.json', to: `${options.uiProject}/tsconfig.json` },
    { from: 'knowledge-graph-ui/tsconfig.spec.json', to: `${options.uiProject}/tsconfig.spec.json` },
    { from: 'knowledge-graph-ui/vite.config.mts', to: `${options.uiProject}/vite.config.mts` },
    { from: 'knowledge-graph-ui/public/favicon.ico', to: `${options.uiProject}/public/favicon.ico` },
    { from: 'knowledge-graph-ui/src/main.tsx', to: `${options.uiProject}/src/main.tsx` },
    { from: 'knowledge-graph-ui/src/styles.css', to: `${options.uiProject}/src/styles.css` },
    { from: 'knowledge-graph-ui/src/app/app.module.css', to: `${options.uiProject}/src/app/app.module.css` },
    { from: 'knowledge-graph-ui/src/app/app.spec.tsx', to: `${options.uiProject}/src/app/app.spec.tsx` },
    { from: 'knowledge-graph-ui/src/app/app.tsx', to: `${options.uiProject}/src/app/app.tsx` },
    { from: 'knowledge-graph-ui/src/app/nx-welcome.tsx', to: `${options.uiProject}/src/app/nx-welcome.tsx` },
    { from: 'knowledge-graph-ui/src/assets/.gitkeep', to: `${options.uiProject}/src/assets/.gitkeep` },

    { from: 'knowledge-graph-ui-e2e/eslint.config.mjs', to: `${options.uiE2eProject}/eslint.config.mjs` },
    { from: 'knowledge-graph-ui-e2e/package.template.json', to: `${options.uiE2eProject}/package.json` },
    { from: 'knowledge-graph-ui-e2e/playwright.config.mts', to: `${options.uiE2eProject}/playwright.config.mts` },
    { from: 'knowledge-graph-ui-e2e/tsconfig.json', to: `${options.uiE2eProject}/tsconfig.json` },
    { from: 'knowledge-graph-ui-e2e/src/example.spec.ts', to: `${options.uiE2eProject}/src/example.spec.ts` },
  ];
}

function buildReplacements(
  options: NormalizedOptions
): Array<readonly [string, string]> {
  const replacements: Array<readonly [string, string]> = [
    [
      '@dev-portal/knowledge-graph-models',
      toScopedPackageName(options.scope, options.modelsProject),
    ],
    ['@dev-portal/knowledge-graph-sdk', toScopedPackageName(options.scope, options.sdkProject)],
    ['@org/knowledge-graph-api-e2e', toScopedPackageName(options.scope, options.apiE2eProject)],
    ['@org/knowledge-graph-api', toScopedPackageName(options.scope, options.apiProject)],
    ['@org/knowledge-graph-models', toScopedPackageName(options.scope, options.modelsProject)],
    ['@org/knowledge-graph-sdk', toScopedPackageName(options.scope, options.sdkProject)],
    ['@org/knowledge-graph-ui-e2e', toScopedPackageName(options.scope, options.uiE2eProject)],
    ['@org/knowledge-graph-ui', toScopedPackageName(options.scope, options.uiProject)],
    ['knowledge-graph-api-e2e', options.apiE2eProject],
    ['knowledge-graph-api', options.apiProject],
    ['knowledge-graph-models', options.modelsProject],
    ['knowledge-graph-sdk', options.sdkProject],
    ['knowledge-graph-ui-e2e', options.uiE2eProject],
    ['knowledge-graph-ui', options.uiProject],
    ['../../../../../tsconfig.base.json', '../../../../tsconfig.base.json'],
    ['../../../../../jest.preset.js', '../../../../jest.preset.js'],
    ['jest.config.cts', 'jest.config.cjs'],
    ['KnowledgeGraph', options.resourceNamePascal],
    ['Ping', options.featureNamePascal],
    ['ping', options.featureName],
    ['knowledge-graph', options.resourceName],
  ];

  if (options.apiPort !== 3000) {
    replacements.push(['3000', `${options.apiPort}`]);
  }

  if (options.uiPort !== 4200) {
    replacements.push(['4200', `${options.uiPort}`]);
  }

  return replacements.sort((a, b) => b[0].length - a[0].length);
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

function enforcePackageMetadata(tree: Tree, options: NormalizedOptions): void {
  const scopedModels = toScopedPackageName(options.scope, options.modelsProject);
  const expressVersion = getRootDependencyVersion(tree, 'express', '^5.1.0');
  const tslibVersion = getRootDependencyVersion(tree, 'tslib', '^2.3.0');
  const zodVersion = getRootDependencyVersion(tree, 'zod', '^4.4.3');

  updateJson(tree, joinPathFragments(options.apiRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.apiProject);
    json.version = DEFAULT_VERSION;
    json.private = true;
    json.nx ??= {};
    json.nx.name = options.apiProject;
    const scripts = toRecord(json.scripts);
    scripts.build = 'tsc --build tsconfig.app.json';
    scripts.serve = 'node dist/main.js';
    json.scripts = sortRecord(scripts);
    json.dependencies = sortRecord({
      [scopedModels]: `^${DEFAULT_VERSION}`,
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

  updateJson(tree, joinPathFragments(options.modelsRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.modelsProject);
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
  });

  updateJson(tree, joinPathFragments(options.sdkRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.sdkProject);
    json.version = DEFAULT_VERSION;
    delete json.private;
    json.type = 'module';
    json.main = './dist/index.esm.js';
    json.module = './dist/index.esm.js';
    json.types = './dist/index.esm.d.ts';
    json.exports = {
      './package.json': './package.json',
      '.': {
        '@org/source': './src/index.ts',
        types: './dist/index.esm.d.ts',
        import: './dist/index.esm.js',
        default: './dist/index.esm.js',
      },
    };
    json.files = ['dist', '!**/*.tsbuildinfo'];
    json.nx ??= {};
    json.nx.name = options.sdkProject;
    json.dependencies = sortRecord({
      [scopedModels]: `^${DEFAULT_VERSION}`,
    });
    return json;
  });

  updateJson(tree, joinPathFragments(options.uiRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.uiProject);
    json.version = DEFAULT_VERSION;
    json.private = true;
    json.nx ??= {};
    json.nx.name = options.uiProject;
    return json;
  });

  updateJson(tree, joinPathFragments(options.uiE2eRoot, 'package.json'), (json) => {
    json.name = toScopedPackageName(options.scope, options.uiE2eProject);
    json.version = DEFAULT_VERSION;
    json.private = true;
    json.nx ??= {};
    json.nx.name = options.uiE2eProject;
    json.nx.implicitDependencies = [options.uiProject];
    return json;
  });
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

function sortRecord(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right))
  );
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

function toScopedPackageName(scope: string, name: string): string {
  return `${scope}/${name}`;
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
