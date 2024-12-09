import {
  Class,
  Attribute,
  Association,
  deserializeJsonToClasses,
  ModelTypeToCodeType,
} from '../../../genmodel';
import * as fs from 'fs';

const genModelPath = './output/genModel.json';
const outputRoot = './output/typescript/model';
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
    classContent = `import { ${c.parent?.name} } from '../${c.parent?.namespace}/${c.parent?.name}';\n`;
  for (const associaton of refDataAssociations) {
    classContent += `import { ${associaton.target.class.name} } from '../${associaton.target.class.namespace}/${associaton.target.class.name}';\n`;
  }
  for (const associaton of collectionAssociations) {
    classContent += `import { ${associaton.target.class.name} } from '../${associaton.target.class.namespace}/${associaton.target.class.name}';\n`;
  }
  classContent += '\n';

  if (c.parent?.name) {
    classContent += `export class ${c.name} extends ${
      c.parent?.name ?? 'baseclass'
    }
   {\n`;
  } else {
    classContent += `export class ${c.name} {\n`;
  }
  for (const a of c.attributes) {
    const theType = ModelTypeToCodeType(a.type, 'typescript');

    if (theType === 'string') {
      classContent += `  private _${a.name}: string = '';\n`;
    }
    if (theType === 'number') {
      classContent += `  private _${a.name}: number = 0;\n`;
    }
    if (theType === 'boolean') {
      classContent += `  private _${a.name}: boolean = false;\n`;
    }
    if (theType === 'Date') {
      classContent += `  private _${a.name}: Date = new Date;\n`;
    }
  }
  for (const assoc of refDataAssociations) {
    classContent += `  private _${assoc.target.role}: ${assoc.target.class.name} | null = null;\n`;
  }
  for (const assoc of collectionAssociations) {
    classContent += `  private _${assoc.target.role}: ${assoc.target.class.name}[] = [];\n`;
  }

  classContent += '\n';

  if (c.parent?.name) {
    classContent += `  constructor(...args: unknown[]) {\n`;
    classContent += `    super(...args);\n`;
    classContent += `  }\n`;
    classContent += '\n';
  } else {
    classContent += `  constructor(...args: unknown[]) {\n`;
    classContent += `  }\n`;
    classContent += '\n';
  }

  classContent += `  toString(): string {\n`;
  classContent += `    let retval = \`\${this.constructor.name}:\n\`;\n`;
  classContent += `    for (const prop in this) {\n`;
  classContent += `      if (Object.prototype.hasOwnProperty.call(this, prop)) {\n`;
  classContent += `        const value = this[prop];\n`;
  classContent += `        if (value === null || value === undefined) {\n`;
  classContent += `          retval += \`   \${prop} = \${value}\\n\`;\n`;
  classContent += `        } else if (typeof value === 'object') {\n`;
  classContent += `          retval += \`   \${prop} = \\n   \${value.toString()}\\n\`;\n`;
  classContent += `        } else {\n`;
  classContent += `          retval += \`   \${prop} = \${value}\\n\`;\n`;
  classContent += `        }\n`;
  classContent += `      }\n`;
  classContent += `    }\n`;
  classContent += `    return retval;\n`;
  classContent += `  }\n`;
  classContent += '\n';

  for (const a of c.attributes) {
    classContent += `  // Getter and setter for ${a.name}\n`;
    classContent += `  public get ${a.name}(): ${ModelTypeToCodeType(
      a.type,
      'typescript',
    )} {\n`;
    classContent += `    return this._${a.name};\n`;
    classContent += `  }\n`;
    classContent += '\n';
    classContent += `  public set ${a.name}(value: ${ModelTypeToCodeType(
      a.type,
      'typescript',
    )}) {\n`;
    classContent += `    this._${a.name} = value;\n`;
    classContent += `  }\n`;
    classContent += '\n';
  }

  for (const assoc of refDataAssociations) {
    classContent += `  // Getter and setter for ${assoc.target.role}\n`;
    classContent += `  public get ${assoc.target.role}(): ${assoc.target.class.name} | null {\n`;
    classContent += `    return this._${assoc.target.role};\n`;
    classContent += `  }\n`;
    classContent += '\n';
    classContent += `  public set ${assoc.target.role}(value: ${assoc.target.class.name} | null) {\n`;
    classContent += `    this._${assoc.target.role} = value;\n`;
    classContent += `  }\n`;
    classContent += '\n';
  }

  for (const assoc of collectionAssociations) {
    classContent += `  // Getter and setter for ${assoc.target.role}\n`;
    classContent += `  public get ${assoc.target.role}(): ${assoc.target.class.name}[] {\n`;
    classContent += `    return this._${assoc.target.role};\n`;
    classContent += `  }\n`;
    classContent += '\n';
    classContent += `  public set ${assoc.target.role}(value: ${assoc.target.class.name}[]) {\n`;
    classContent += `    this._${assoc.target.role} = value;\n`;
    classContent += `  }\n`;
    classContent += '\n';
  }

  // create a public toJSON() method.
  // return will be a JSON object with all attributes and associations of this class and its parent classes
  classContent += `  public toJSON() {\n`;
  classContent += `    const retval = {\n`;
  if (c.parent?.name) {
    classContent += `      ...super.toJSON(),\n`;
  }
  for (const a of c.attributes) {
    classContent += `      ${a.name}: this.${a.name},\n`;
  }
  for (const assoc of refDataAssociations) {
    classContent += `      ${assoc.target.role}: this.${assoc.target.role},\n`;
  }
  for (const assoc of collectionAssociations) {
    classContent += `      ${assoc.target.role}: this.${assoc.target.role},\n`;
  }
  classContent += `    };\n`;

  classContent += `    return retval;\n`;

  classContent += `  };\n`;

  classContent += '}\n';

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
  fs.writeFileSync(filePath + '/' + c.name + '.ts', classContent, 'utf8');
}
