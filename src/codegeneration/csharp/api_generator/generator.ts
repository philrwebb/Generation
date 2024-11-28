// create the project folder structure under output/csharp/api - the root folder will be provided as the project name

import {
  Model,
  Class,
  Association,
  deserializeJsonToClasses,
  ModelTypeToCodeType,
} from '../../../genmodel';
import {
  writeControllerFile,
  writeExtensions,
  writeProjectFile,
  writeProgramFile,
  writeRepositoryInfrastructureFile,
  writeIRepositoryFile,
  writeRepositoryFile,
  setUpFolders,
  toLowerCamelCase,
  pluralize,
  writeDbContextFile,
} from './csharpgenutils';
import config from './config';

const model: Model = deserializeJsonToClasses(config.genModelPath);

setUpFolders(
  config.outputRoot,
  config.controllerRoot,
  config.modelRoot,
  config.repositoryRoot,
  config.extensionsRoot,
  config.dataRoot,
  config.genClassPath,
);

writeProjectFile(config.projectName, config.outputRoot);

writeExtensions(config.projectName, config.extensionsRoot);

writeProgramFile(config.projectName, config.outputRoot);

const usings = new Set<string>();
let dbSets = '';
let modelBuilderConfig = '';
model.classes.forEach((c: Class) => {
  if (c.isAbstract) return; // skip abstract classes
  const pluralizedName = pluralize(c.name);
  usings.add(`using model.${c.namespace};`);
  dbSets += `    public DbSet<${c.name}> ${pluralizedName} { get; set; } = null!;\n`;
  modelBuilderConfig += `            .HasValue<${c.name}>("${c.name}")\n`;
  const refDataAssociations = model.associations.filter(
    (a) =>
      a.source.multiplicity === '*' &&
      a.target.multiplicity === '1' &&
      a.source.class.name === c.name, // this class is the parent
  );
  let collectionAssociations = model.associations.filter(
    (a) =>
      (a.source.multiplicity === '0' || a.source.multiplicity === '1') &&
      a.target.multiplicity === '*' &&
      a.source.class.name === c.name, // this class is the parent
  );
  const uniqueAssociations = new Set();
  const usingCollectionAssociations = collectionAssociations.filter((a) => {
    const key = `${a.source.class.name}`;
    if (uniqueAssociations.has(key)) {
      return false;
    } else {
      uniqueAssociations.add(key);
      return true;
    }
  });
  writeControllerFile(
    c.name,
    toLowerCamelCase(c.name),
    config.projectName,
    c.namespace ?? '',
    config.controllerRoot,
  );
  writeRepositoryInfrastructureFile(config.repositoryRoot, config.projectName);
  writeIRepositoryFile(
    config.projectName,
    c.name,
    c.namespace ?? '',
    config.repositoryRoot,
  );
  writeRepositoryFile(
    c.name,
    toLowerCamelCase(c.name),
    config.projectName,
    config.repositoryRoot,
    c.namespace ?? '',
  );
});
console.log('usings', usings);
console.log('dbSets', dbSets);
console.log('modelBuilderConfig', modelBuilderConfig);
writeDbContextFile(
  config.projectName,
  usings,
  dbSets,
  modelBuilderConfig,
  config.dataRoot,
);

// from here on in will be in a loop through the classes in the model
// let className = 'ContactType';
// let namespace = 'referencedata';
// writeControllerFile(
//   className,
//   toLowerCamelCase(className),
//   config.projectName,
//   namespace,
//   config.controllerRoot,
// );

// writeRepositoryInfrastructureFile(config.repositoryRoot, config.projectName);

// writeIRepositoryFile(
//   config.projectName,
//   className,
//   namespace,
//   config.repositoryRoot,
// );

// writeRepositoryFile(
//   className,
//   toLowerCamelCase(className),
//   config.projectName,
//   config.repositoryRoot,
//   namespace,
// );

// writeDbContextFile(config.projectName, className, config.dataRoot);
