const projectName = 'PersonApi';
const genModelPath = './output/genModel.json'; // relative to the execution path
const genClassPath = './output/csharp/model'; // relative to the execution path
const outputRoot = './output/csharp/api/' + projectName; // relative to the execution path
const controllerRoot = outputRoot + '/Controllers'; // relative to the outputRoot
const modelRoot = outputRoot + '/Models'; // relative to the outputRoot
const repositoryRoot = outputRoot + '/Repositories'; // relative to the outputRoot
const extensionsRoot = outputRoot + '/Extensions'; // relative to the outputRoot
const dataRoot = outputRoot + '/Data'; // relative to the outputRoot

export default class config {
  static projectName = projectName;
  static genModelPath = genModelPath;
  static genClassPath = genClassPath;
  static outputRoot = outputRoot;
  static controllerRoot = controllerRoot;
  static modelRoot = modelRoot;
  static repositoryRoot = repositoryRoot;
  static extensionsRoot = extensionsRoot;
  static dataRoot = dataRoot;
}
