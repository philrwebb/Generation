import {
  Class,
  Attribute,
  Association,
  deserializeJsonToClasses,
  ModelTypeToCodeType,
  WriteFile,
  printModel,
} from '../../../genmodel';
import * as fs from 'fs';
import * as path from 'path';

const genModelPath = './output/genModel.json';
const outputRoot = './output/python/model';
console.log('Current directory:', process.cwd());
const model = deserializeJsonToClasses(genModelPath);
if (!fs.existsSync(outputRoot)) {
  fs.mkdirSync(outputRoot, { recursive: true });
}

const buildClass = (
  c: Class,
  refDataAssociations: Association[],
  collectionAssociations: Association[],
): string => {
  let classContent = '';
  if (c.parent?.name)
    classContent = `from ${c.parent?.namespace}.${c.parent?.name} import ${c.parent?.name}\n`;
  for (const associaton of refDataAssociations) {
    classContent += `from ${associaton.target.class.namespace}.${associaton.target.class.name} import ${associaton.target.class.name}\n`;
  }
  for (const associaton of collectionAssociations) {
    classContent += `from ${associaton.target.class.namespace}.${associaton.target.class.name} import ${associaton.target.class.name}\n`;
  }
  classContent += `from datetime import date\n\n`;
  classContent += `class ${c.name}(${c.parent?.name ?? ''}):\n`;
  for (const a of c.attributes) {
    classContent += `    _${a.name}: ${ModelTypeToCodeType(
      a.type,
      'python',
    )}\n`;
  }
  for (const assoc of refDataAssociations) {
    classContent += `    _${assoc.target.role}: ${assoc.target.class.name}\n`;
  }
  for (const assoc of collectionAssociations) {
    classContent += `    _${assoc.target.role}: list[${assoc.target.class.name}]\n`;
  }
  classContent += '\n';
  classContent += `    def __init__(self, *args, **kwargs):\n`;
  classContent += `        super().__init__(*args, **kwargs)\n`;
  classContent += '\n';

  for (const a of c.attributes) {
    classContent += `    @property\n`;
    classContent += `    def ${a.name}(self) -> ${ModelTypeToCodeType(
      a.type,
      'python',
    )}:\n`;
    classContent += `        return self._${a.name}\n`;
    classContent += '\n';
    classContent += `    @${a.name}.setter\n`;
    classContent += `    def ${a.name}(self, value: ${ModelTypeToCodeType(
      a.type,
      'python',
    )}):\n`;
    classContent += `        self._${a.name} = value\n`;
    classContent += '\n';
  }

  for (const assoc of refDataAssociations) {
    classContent += `    @property\n`;
    classContent += `    def ${assoc.target.role}(self) -> ${assoc.target.class.name}:\n`;
    classContent += `        return self._${assoc.target.role}\n`;
    classContent += '\n';
    classContent += `    @${assoc.target.role}.setter\n`;
    classContent += `    def ${assoc.target.role}(self, value: ${assoc.target.class.name}):\n`;
    classContent += `        self._${assoc.target.role} = value\n`;
    classContent += '\n';
  }

  for (const assoc of collectionAssociations) {
    classContent += `    @property\n`;
    classContent += `    def ${assoc.target.role}(self) -> list[${assoc.target.class.name}]:\n`;
    classContent += `        return self._${assoc.target.role}\n`;
    classContent += '\n';
    classContent += `    @${assoc.target.role}.setter\n`;
    classContent += `    def ${assoc.target.role}(self, value: list[${assoc.target.class.name}]):\n`;
    classContent += `        self._${assoc.target.role} = value\n`;
    classContent += '\n';
  }
  return classContent;
};

// printModel(model);
for (const c of model.classes) {
  const refDataAssociations = model.associations.filter(
    (a) =>
      a.source.multiplicity === '*' &&
      a.target.multiplicity === '1' &&
      a.source.class.name === c.name, // this class is the parent
  );

  // find 1 to * (e.g. class with collections)
  const collectionAssociations = model.associations.filter(
    (a) =>
      (a.source.multiplicity === '0' || a.source.multiplicity === '1') &&
      a.target.multiplicity === '*' &&
      a.source.class.name === c.name, // this class is the parent
  );

  const classContent = buildClass(
    c,
    refDataAssociations,
    collectionAssociations,
  );

  const filePath = outputRoot + '/' + c.namespace;
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
  fs.writeFileSync(filePath + '/' + c.name + '.py', classContent, 'utf8');

  console.log(classContent);
}

const items = fs.readdirSync(outputRoot);

const directories = items.filter((item) => {
  const itemPath = path.join(outputRoot, item);
  return fs.statSync(itemPath).isDirectory();
});

for (const directory of directories) {
  const files = fs.readdirSync(path.join(outputRoot, directory));
  console.log('Files in', directory);
  let all = '[';
  let fileContent = '';
  for (const file of files) {
    // ignore __init__.py if there
    if (file === '__init__.py') {
      continue;
    }
    const name = file.replace(/\.[^/.]+$/, '');
    fileContent += `from .${name} import ${name}\n`;
    all += `"${name}", `;
  }
  // trim trailing comma from all
  all = all.slice(0, -2);
  all += ']';
  fileContent += `\n__all__ = ${all}`;
  // if file __init__.py exists, delete it
  if (fs.existsSync(path.join(outputRoot, directory, '__init__.py'))) {
    fs.unlinkSync(path.join(outputRoot, directory, '__init__.py'));
  }
  fs.writeFileSync(
    path.join(outputRoot, directory, '__init__.py'),
    fileContent,
    'utf8',
  );
}
