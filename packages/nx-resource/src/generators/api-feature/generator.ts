// GitHub Copilot generated code - start
import {
  formatFiles,
  getProjects,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';

import { ApiFeatureGeneratorSchema } from './schema';
import {
  ensureTemplateRootExists,
  resolveTemplateRoot,
} from '../shared/template-root';

const TEMPLATE_RESOURCE_NAME = 'knowledge-graph';
const TEMPLATE_FEATURE_NAME = 'ping';
const FEATURE_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

interface NormalizedOptions {
  apiProject: string;
  featureName: string;
  featureNamePascal: string;
  skipFormat: boolean;
  templateRoot: string;
  templateApiRoot: string;
  templateFeatureRoot: string;
}

interface ApiTargetState {
  apiRoot: string;
  appPath: string;
  repositoryPath: string;
  packageJsonPath: string;
  modelsPackageName: string;
}

interface ModelsTargetState {
  modelsProject: string;
  modelsRoot: string;
  packageName: string;
  indexPath: string;
  libraryPath: string;
}

export async function apiFeatureGenerator(
  tree: Tree,
  schema: ApiFeatureGeneratorSchema
): Promise<void> {
  const options = normalizeOptions(schema);

  ensureTemplateFeatureExists(tree, options);

  const apiState = resolveApiTargetState(tree, options);
  const modelsState = resolveModelsTargetState(tree, apiState);

  ensureFeatureCanBeAdded(tree, options, apiState, modelsState);

  scaffoldFeatureFiles(tree, options, apiState, modelsState);
  extendRepository(tree, options, apiState);
  wireFeatureRoute(tree, options, apiState);
  extendModelsContracts(tree, options, modelsState);
  ensureModelsIndexExport(tree, modelsState);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default apiFeatureGenerator;

function normalizeOptions(schema: ApiFeatureGeneratorSchema): NormalizedOptions {
  const apiProject = schema.apiProject?.trim();
  if (!apiProject) {
    throw new Error('apiProject is required.');
  }

  const rawFeatureName = schema.featureName?.trim();
  if (!rawFeatureName) {
    throw new Error('featureName is required.');
  }

  const featureName = names(rawFeatureName).propertyName;
  if (!FEATURE_NAME_PATTERN.test(featureName)) {
    throw new Error(
      `The feature name must resolve to a valid camelCase identifier. Received "${schema.featureName}".`
    );
  }

  const templateRoot = resolveTemplateRoot(
    schema.templateRoot,
    TEMPLATE_RESOURCE_NAME
  );

  return {
    apiProject,
    featureName,
    featureNamePascal: names(featureName).className,
    skipFormat: schema.skipFormat ?? false,
    templateRoot,
    templateApiRoot: joinPathFragments(
      templateRoot,
      `${TEMPLATE_RESOURCE_NAME}-api`
    ),
    templateFeatureRoot: joinPathFragments(
      templateRoot,
      `${TEMPLATE_RESOURCE_NAME}-api`,
      'src/features',
      TEMPLATE_FEATURE_NAME
    ),
  };
}

function ensureTemplateFeatureExists(tree: Tree, options: NormalizedOptions): void {
  ensureTemplateRootExists(tree, options.templateRoot, TEMPLATE_RESOURCE_NAME);

  const requiredPaths = [
    joinPathFragments(options.templateFeatureRoot, 'controller.ts'),
    joinPathFragments(options.templateFeatureRoot, 'service.ts'),
    joinPathFragments(options.templateFeatureRoot, 'test.spec.ts'),
    joinPathFragments(options.templateApiRoot, 'src/features/repository.ts'),
  ];

  const missing = requiredPaths.filter((path) => !tree.exists(path));
  if (missing.length > 0) {
    throw new Error(
      [
        'Canonical API feature template is incomplete.',
        'Missing files:',
        missing.map((path) => `"${path}"`).join(', '),
      ].join(' ')
    );
  }
}

function resolveApiTargetState(
  tree: Tree,
  options: NormalizedOptions
): ApiTargetState {
  let apiConfig: { root: string };

  try {
    apiConfig = readProjectConfiguration(tree, options.apiProject);
  } catch {
    const projects = Array.from(getProjects(tree).keys())
      .sort((left, right) => left.localeCompare(right))
      .join(', ');
    throw new Error(
      `Could not find Nx project "${options.apiProject}". Available projects: ${projects}`
    );
  }

  const apiRoot = apiConfig.root;
  const appPath = joinPathFragments(apiRoot, 'src/app.ts');
  const repositoryPath = joinPathFragments(apiRoot, 'src/features/repository.ts');
  const packageJsonPath = joinPathFragments(apiRoot, 'package.json');

  for (const path of [appPath, repositoryPath, packageJsonPath]) {
    if (!tree.exists(path)) {
      throw new Error(
        `Project "${options.apiProject}" is missing required file "${path}".`
      );
    }
  }

  const packageJson = readJson(tree, packageJsonPath) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const modelsPackageName = resolveModelsPackageName(packageJson);

  return {
    apiRoot,
    appPath,
    repositoryPath,
    packageJsonPath,
    modelsPackageName,
  };
}

function resolveModelsPackageName(packageJson: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string {
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  const candidates = dependencyNames.filter((name) => name.endsWith('-models'));

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length === 0) {
    throw new Error(
      'Could not resolve a models package dependency for this API. Expected one dependency ending with "-models".'
    );
  }

  throw new Error(
    [
      'Could not resolve a unique models package dependency for this API.',
      `Found multiple candidates: ${candidates.join(', ')}`,
    ].join(' ')
  );
}

function resolveModelsTargetState(
  tree: Tree,
  apiState: ApiTargetState
): ModelsTargetState {
  const matches: Array<{ name: string; root: string }> = [];

  for (const [projectName, projectConfig] of getProjects(tree).entries()) {
    const packageJsonPath = joinPathFragments(projectConfig.root, 'package.json');
    if (!tree.exists(packageJsonPath)) {
      continue;
    }

    const packageJson = readJson(tree, packageJsonPath) as { name?: string };
    if (packageJson.name === apiState.modelsPackageName) {
      matches.push({ name: projectName, root: projectConfig.root });
    }
  }

  if (matches.length === 0) {
    throw new Error(
      `Could not locate Nx project for models package "${apiState.modelsPackageName}".`
    );
  }

  if (matches.length > 1) {
    throw new Error(
      [
        `Multiple Nx projects map to models package "${apiState.modelsPackageName}".`,
        `Matches: ${matches.map((match) => match.name).join(', ')}`,
      ].join(' ')
    );
  }

  const modelsProject = matches[0].name;
  const modelsRoot = matches[0].root;
  const indexPath = joinPathFragments(modelsRoot, 'src/index.ts');

  if (!tree.exists(indexPath)) {
    throw new Error(
      `Models project "${modelsProject}" is missing required file "${indexPath}".`
    );
  }

  const indexSource = readRequiredFile(tree, indexPath);
  const libraryPath = resolveModelsLibraryPath(tree, modelsRoot, indexSource);

  return {
    modelsProject,
    modelsRoot,
    packageName: apiState.modelsPackageName,
    indexPath,
    libraryPath,
  };
}

function resolveModelsLibraryPath(
  tree: Tree,
  modelsRoot: string,
  indexSource: string
): string {
  const directExportPattern = /export \* from ['"]\.\/lib\/([^'"]+)\.js['"];/;
  const directExportMatch = directExportPattern.exec(indexSource);

  if (directExportMatch) {
    const directPath = joinPathFragments(
      modelsRoot,
      'src/lib',
      `${directExportMatch[1]}.ts`
    );
    if (tree.exists(directPath)) {
      return directPath;
    }
  }

  const libRoot = joinPathFragments(modelsRoot, 'src/lib');
  if (!tree.exists(libRoot)) {
    throw new Error(`Models project is missing lib directory "${libRoot}".`);
  }

  const candidates = tree
    .children(libRoot)
    .filter((fileName) => fileName.endsWith('-models.ts'));

  if (candidates.length === 1) {
    return joinPathFragments(libRoot, candidates[0]);
  }

  if (candidates.length === 0) {
    throw new Error(
      `Could not resolve models contract file under "${libRoot}". Expected one *-models.ts file.`
    );
  }

  throw new Error(
    [
      `Could not resolve a unique models contract file under "${libRoot}".`,
      `Found: ${candidates.join(', ')}`,
    ].join(' ')
  );
}

function ensureFeatureCanBeAdded(
  tree: Tree,
  options: NormalizedOptions,
  apiState: ApiTargetState,
  modelsState: ModelsTargetState
): void {
  const featureRoot = joinPathFragments(
    apiState.apiRoot,
    'src/features',
    options.featureName
  );

  if (tree.exists(featureRoot)) {
    throw new Error(
      `Feature directory already exists at "${featureRoot}". Choose a different feature name.`
    );
  }

  const appSource = readRequiredFile(tree, apiState.appPath);
  const repositorySource = readRequiredFile(tree, apiState.repositoryPath);
  const modelsSource = readRequiredFile(tree, modelsState.libraryPath);

  const controllerFactoryName = `create${options.featureNamePascal}Controller`;
  if (appSource.includes(controllerFactoryName)) {
    throw new Error(
      `App wiring already contains "${controllerFactoryName}" in "${apiState.appPath}".`
    );
  }

  const routeRegistration = `app.use('/${options.featureName}', ${controllerFactoryName}())`;
  if (appSource.includes(routeRegistration)) {
    throw new Error(
      `Route "${routeRegistration}" already exists in "${apiState.appPath}".`
    );
  }

  const repositoryFactoryName = `create${options.featureNamePascal}Repository`;
  if (repositorySource.includes(repositoryFactoryName)) {
    throw new Error(
      `Repository factory "${repositoryFactoryName}" already exists in "${apiState.repositoryPath}".`
    );
  }

  const requestSchemaName = `${options.featureName}RequestSchema`;
  const responseSchemaName = `${options.featureName}ResponseSchema`;
  if (
    modelsSource.includes(`export const ${requestSchemaName}`) ||
    modelsSource.includes(`export const ${responseSchemaName}`)
  ) {
    throw new Error(
      [
        `Models contracts for "${options.featureName}" already exist in "${modelsState.libraryPath}".`,
        `Found schema symbols "${requestSchemaName}" and/or "${responseSchemaName}".`,
      ].join(' ')
    );
  }
}

function scaffoldFeatureFiles(
  tree: Tree,
  options: NormalizedOptions,
  apiState: ApiTargetState,
  modelsState: ModelsTargetState
): void {
  const featureRoot = joinPathFragments(
    apiState.apiRoot,
    'src/features',
    options.featureName
  );

  const replacements = buildFeatureReplacements(options, modelsState);

  copyTemplateFile(
    tree,
    joinPathFragments(options.templateFeatureRoot, 'controller.ts'),
    joinPathFragments(featureRoot, 'controller.ts'),
    replacements
  );
  copyTemplateFile(
    tree,
    joinPathFragments(options.templateFeatureRoot, 'service.ts'),
    joinPathFragments(featureRoot, 'service.ts'),
    replacements
  );
  copyTemplateFile(
    tree,
    joinPathFragments(options.templateFeatureRoot, 'test.spec.ts'),
    joinPathFragments(featureRoot, 'test.spec.ts'),
    replacements
  );
}

function buildFeatureReplacements(
  options: NormalizedOptions,
  modelsState: ModelsTargetState
): Array<readonly [string, string]> {
  const replacements: Array<readonly [string, string]> = [
    ['@dev-portal/knowledge-graph-models', modelsState.packageName],
    ['@org/knowledge-graph-models', modelsState.packageName],
    ['Ping', options.featureNamePascal],
    ['ping', options.featureName],
  ];

  return replacements.sort((left, right) => right[0].length - left[0].length);
}

function copyTemplateFile(
  tree: Tree,
  sourcePath: string,
  targetPath: string,
  replacements: Array<readonly [string, string]>
): void {
  const source = readRequiredFile(tree, sourcePath);
  tree.write(targetPath, applyReplacements(source, replacements));
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

function extendRepository(
  tree: Tree,
  options: NormalizedOptions,
  apiState: ApiTargetState
): void {
  const source = readRequiredFile(tree, apiState.repositoryPath);
  const next = ensureRuntimeImport(source);

  const appendedBlock = [
    '// GitHub Copilot generated code - start',
    `export type ${options.featureNamePascal}RepositoryRecord = {`,
    '  checkedAt: string;',
    '  uptimeSeconds: number;',
    '};',
    '',
    `export interface ${options.featureNamePascal}Repository {`,
    `  getHealthSnapshot(): ${options.featureNamePascal}RepositoryRecord;`,
    '}',
    '',
    `export const create${options.featureNamePascal}Repository = (): ${options.featureNamePascal}Repository => ({`,
    '  getHealthSnapshot: () => getRuntimeSnapshot(),',
    '});',
    '// GitHub Copilot generated code - end',
    '',
  ].join('\n');

  tree.write(apiState.repositoryPath, `${trimTrailingWhitespace(next)}\n\n${appendedBlock}`);
}

function ensureRuntimeImport(source: string): string {
  const runtimeImport = "import { getRuntimeSnapshot } from '../shared/runtime';";
  if (source.includes(runtimeImport)) {
    return source;
  }

  return `${runtimeImport}\n\n${source}`;
}

function wireFeatureRoute(
  tree: Tree,
  options: NormalizedOptions,
  apiState: ApiTargetState
): void {
  const controllerFactoryName = `create${options.featureNamePascal}Controller`;
  const importStatement = `import { ${controllerFactoryName} } from './features/${options.featureName}/controller';`;
  const routeLine = `  app.use('/${options.featureName}', ${controllerFactoryName}());`;

  const source = readRequiredFile(tree, apiState.appPath);

  const withImport = insertImportStatement(source, importStatement);
  const withRoute = insertRouteBeforeReturn(withImport, routeLine);

  tree.write(apiState.appPath, withRoute);
}

function insertImportStatement(source: string, statement: string): string {
  if (source.includes(statement)) {
    throw new Error(`App already imports "${statement}".`);
  }

  const importMatches = Array.from(source.matchAll(/^import .+;$/gm));
  if (importMatches.length === 0) {
    throw new Error('Could not locate import block in app.ts.');
  }

  const lastImport = importMatches.at(-1);
  if (!lastImport) {
    throw new Error('Could not locate import block in app.ts.');
  }

  const insertAt = (lastImport.index ?? 0) + lastImport[0].length;

  return `${source.slice(0, insertAt)}\n${statement}${source.slice(insertAt)}`;
}

function insertRouteBeforeReturn(source: string, routeLine: string): string {
  if (source.includes(routeLine)) {
    throw new Error(`App already contains route registration "${routeLine}".`);
  }

  const lines = source.split('\n');
  const returnLineIndex = lines.findIndex((line) => line.trim() === 'return app;');

  if (returnLineIndex === -1) {
    throw new Error('Could not locate "return app;" in app.ts.');
  }

  const returnLine = lines[returnLineIndex];
  const indentEnd = returnLine.indexOf('return app;');
  const indent = indentEnd > 0 ? returnLine.slice(0, indentEnd) : '';

  lines.splice(returnLineIndex, 0, `${indent}${routeLine.trimStart()}`, '');
  return lines.join('\n');
}

function extendModelsContracts(
  tree: Tree,
  options: NormalizedOptions,
  modelsState: ModelsTargetState
): void {
  const requestSchemaName = `${options.featureName}RequestSchema`;
  const responseSchemaName = `${options.featureName}ResponseSchema`;
  const requestTypeName = `${options.featureNamePascal}Request`;
  const responseTypeName = `${options.featureNamePascal}Response`;

  let source = readRequiredFile(tree, modelsState.libraryPath);

  if (!/from ['"]zod['"]/.test(source)) {
    source = `import { z } from 'zod';\n\n${source}`;
  }

  const block = [
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

  tree.write(modelsState.libraryPath, `${trimTrailingWhitespace(source)}\n\n${block}`);
}

function ensureModelsIndexExport(tree: Tree, modelsState: ModelsTargetState): void {
  const expectedExport = toModelsExport(modelsState.libraryPath, modelsState.modelsRoot);
  const source = readRequiredFile(tree, modelsState.indexPath);

  if (source.includes(expectedExport)) {
    return;
  }

  const next = `${trimTrailingWhitespace(source)}\n\n${expectedExport}\n`;
  tree.write(modelsState.indexPath, next);
}

function toModelsExport(libraryPath: string, modelsRoot: string): string {
  const libRoot = joinPathFragments(modelsRoot, 'src/lib');
  const fileName = libraryPath.slice(libRoot.length + 1).replace(/\.ts$/, '');
  return `export * from './lib/${fileName}.js';`;
}

function readRequiredFile(tree: Tree, path: string): string {
  const source = tree.read(path, 'utf-8');
  if (source === null) {
    throw new Error(`Missing required file "${path}".`);
  }

  return source;
}

function trimTrailingWhitespace(value: string): string {
  return value.trimEnd();
}
// GitHub Copilot generated code - end
