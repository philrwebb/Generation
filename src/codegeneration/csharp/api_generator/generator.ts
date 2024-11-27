// create the project folder structure under output/csharp/api - the root folder will be provided as the project name

import {
  Class,
  Association,
  deserializeJsonToClasses,
  ModelTypeToCodeType,
} from '../../../genmodel';
import {
  writeControllerFile,
  writeExtensions,
  copyRecursiveSync,
  writeProjectFile,
  writeProgramFile,
  writeRepositoryInfrastructureFile,
  writeIRepositoryFile,
  setUpFolders,
  toLowerCamelCase,
} from './csharpgenutils';
import config from './config';

import * as fs from 'fs';

// refactor to introduce all of these from configuration
const projectName = config.projectName;
const genModelPath = './output/genModel.json'; // relative to the execution path
const genClassPath = './output/csharp/model'; // relative to the execution path
const outputRoot = './output/csharp/api/' + projectName; // relative to the execution path
const controllerRoot = outputRoot + '/Controllers'; // relative to the outputRoot
const modelRoot = outputRoot + '/Models'; // relative to the outputRoot
const repositoryRoot = outputRoot + '/Repositories'; // relative to the outputRoot
const extensionsRoot = outputRoot + '/Extensions'; // relative to the outputRoot
const dataRoot = outputRoot + '/Data'; // relative to the outputRoot

const model = deserializeJsonToClasses(genModelPath);

setUpFolders(
  config.outputRoot,
  config.controllerRoot,
  config.modelRoot,
  config.repositoryRoot,
  config.extensionsRoot,
  config.dataRoot,
  config.genClassPath,
);
let className = 'ContactType';
let namespace = 'referencedata';
writeProjectFile(config.projectName, config.outputRoot);

writeExtensions(config.projectName, config.extensionsRoot);

writeProgramFile(config.projectName, config.outputRoot);

writeControllerFile(
  className,
  toLowerCamelCase(className),
  config.projectName,
  namespace,
  config.controllerRoot,
);

writeRepositoryInfrastructureFile(config.repositoryRoot, config.projectName);

writeIRepositoryFile(
  config.projectName,
  className,
  namespace,
  config.repositoryRoot,
);
