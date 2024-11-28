import {
  Class,
  Association,
  deserializeJsonToClasses,
  ModelTypeToCodeType,
} from '../../../genmodel';
import * as fs from 'fs';

const genModelPath = './output/genModel.json';
const outputRoot = './output/csharp/model';
console.log('Current directory:', process.cwd());
const model = deserializeJsonToClasses(genModelPath);
if (!fs.existsSync(outputRoot)) {
  fs.mkdirSync(outputRoot, { recursive: true });
}
const isEmptyObject = (obj: any): boolean => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};
const buildClass = (
  c: Class,
  refDataAssociations: Association[],
  collectionAssociations: Association[],
  usingCollectionAssociations: Association[] = [],
  foreignKeyAssociations: Association[],
): string => {
  //   console.log(c.parent);
  const parentName = !isEmptyObject(c.parent) ? c.parent?.name : '';
  const parentNameSpace = !isEmptyObject(c.parent)
    ? 'model.' + c.parent?.namespace
    : '';
  let classContent = '';
  classContent += `using System.ComponentModel.DataAnnotations;\n`;
  classContent += `using System.ComponentModel.DataAnnotations.Schema;\n`;
  if (!isEmptyObject(c.parent)) {
    classContent += `using ${parentNameSpace};\n\n`;
  }
  if (usingCollectionAssociations.length > 0) {
    for (const a of usingCollectionAssociations) {
      classContent += `using model.${a.target.class.namespace};\n`;
    }
  } else {
    for (const a of collectionAssociations) {
      classContent += `using model.${a.target.class.namespace};\n`;
    }
  }
  for (const a of refDataAssociations) {
    classContent += `using model.${a.target.class.namespace};\n`;
  }

  classContent += `namespace model.${c.namespace};\n`;

  let abstract = '';
  if (c.isAbstract) abstract = 'abstract ';
  if (!isEmptyObject(c.parent)) {
    classContent += `public ${abstract}class ${c.name} : ${parentName}\n`;
  } else {
    classContent += `public ${abstract}class ${c.name}\n`;
  }
  classContent += '{\n';
  for (const a of c.attributes) {
    switch (a.type) {
      case 'int':
        if (a.name === 'id') {
          classContent += `    [Key]\n`;
          classContent += `    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]\n`;
        }
        classContent += `    public int ${a.name} { get; set; }\n`;
        break;
      case 'string':
        if (a.length !== undefined) {
          classContent += `    [StringLength(${a.length})]\n`;
        }
        if (a.length !== undefined && a.length > 0) {
          classContent += `    [Required]\n`;
        }
        classContent += `    public string ${a.name} { get; set; } = "";\n`;
        break;
      default:
        classContent += `    public ${ModelTypeToCodeType(a.type, 'csharp')} ${
          a.name
        } { get; set; }\n`;
    }
  }
  for (const a of refDataAssociations) {
    classContent += `    public int ${a.target.class.name}Id { get; set; }\n`;
    classContent += `    [ForeignKey("${a.target.class.name}Id")]\n`;
    classContent += `    public virtual ${a.target.class.name}? ${a.target.role} { get; set; } \n`;
  }
  for (const a of foreignKeyAssociations) {
    classContent += `    public int ${a.source.class.name}id { get; set; }\n`;
  }
  for (const a of collectionAssociations) {
    classContent += `    public virtual ICollection<${a.target.class.name}> ${a.target.role} { get; set; } = new List<${a.target.class.name}>(); \n`;
  }
  classContent += '\n}';
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

  const foreignKeyCollections = model.associations.filter(
    (a) =>
      a.target.multiplicity === '*' &&
      (a.source.multiplicity === '1' || a.source.multiplicity === '0') &&
      a.target.class.name === c.name, // this class is the parent
  );

  // find 1 to * (e.g. class with collections)
  let collectionAssociations = model.associations.filter(
    (a) =>
      (a.source.multiplicity === '0' || a.source.multiplicity === '1') &&
      a.target.multiplicity === '*' &&
      a.source.class.name === c.name, // this class is the parent
  );
  // filter out any duplicate entries in collectionAssociations
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

  const classContent = buildClass(
    c,
    refDataAssociations,
    collectionAssociations,
    usingCollectionAssociations,
    foreignKeyCollections,
  );
  //   console.log(classContent);
  const filePath = outputRoot + '/' + c.namespace;
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
  fs.writeFileSync(filePath + '/' + c.name + '.cs', classContent, 'utf8');
}
