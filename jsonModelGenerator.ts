import {
  Class,
  Attribute,
  Association,
  Endpoint,
  Visibility,
  Inheritance,
  Model,
  serializeClassesToJson,
  deserializeJsonToClasses,
  printModel,
  readFileLines,
  FindClass,
} from "./genmodel.js";

const handleClass = (line: string): Class => {
  const pattern = /note for (\w+) "(?:inheritance=(\w+),)?namespace=(\w+)"/;
  const match = line.match(pattern);

  if (!match) {
    throw new Error("Line does not match the expected pattern ");
  }

  const [, className, inheritance = "none", namespace] = match;

  let currentClass: Class = {
    name: className,
    inheritance: inheritance as Inheritance,
    namespace: namespace,
    parent: {} as Class,
    attributes: [],
    isAbstract: false,
  };

  return currentClass;
};

const readAttributeLines = (index: number, lines: string[]): string[] => {
  let attributeLines: string[] = [];
  let i = index + 1;
  while (true) {
    let nextLine: string = lines[i];
    if (nextLine.includes("}")) {
      break;
    }
    attributeLines.push(nextLine);
    i++;
  }
  return attributeLines;
};

const loadClassAttributes = (
  theclass: Class,
  attributeLines: string[]
): Class => {
  const attributePattern =
    /^(?<visibility>[+\-#])(?<type>[a-zA-Z]+)(?::(?<length>\d+)(?:,(?<precision>\d+))?)?\s+(?<name>[a-zA-Z0-9_]+)$/;
  attributeLines.forEach((attributeLine: string) => {
    attributeLine = attributeLine.replace(/^[^a-zA-Z0-9\+\-]+/, "");
    const match = attributeLine.match(attributePattern);

    if (match && match.groups) {
      const { visibility, type, length, precision, name } = match.groups;
      let attribute: Attribute = {
        name: name,
        type: type,
        length: length ? parseInt(length) : 0,
        precision: precision ? parseInt(precision) : 0,
        visibility:
          visibility === "+"
            ? Visibility.Public
            : visibility === "-"
            ? Visibility.Private
            : visibility === "#"
            ? Visibility.Protected
            : Visibility.Public,
      };
      theclass.attributes.push(attribute);
    }
  });
  return theclass;
};

const processInheritanceLine = (line: string, classes: Class[]) => {
  const pattern = /(\w+)\s+(<\|--|--\|>)\s+(\w+)/;
  const match = line.match(pattern);

  if (!match) {
    throw new Error("Line does not match the expected pattern");
  }

  const [, class1, relationship, class2] = match;

  let parent = "";
  let child = "";

  if (relationship === "<|--") {
    parent = class1;
    child = class2;
  } else if (relationship === "--|>") {
    parent = class2;
    child = class1;
  }

  let classToUpdate: Class = FindClass(child, classes);
  let classToAssignAsParent: Class = FindClass(parent, classes);
  classToUpdate.parent = classToAssignAsParent;
  // let parent = "";
  // let child = "";
  // if (line.includes("<|--")) {
  //   parent = line.split(" ")[0];
  //   child = line.split(" ")[2];
  // } else {
  //   parent = line.split(" ")[2];
  //   child = line.split(" ")[0];
  // }
  // let classToUpdate: Class = FindClass(child, classes);
  // let classToAssignAsParent: Class = FindClass(parent, classes);
  // classToUpdate.parent = classToAssignAsParent;
};

const processOneWayAssociationLine = (
  line: string,
  classes: Class[]
): Association => {
  let source: string = line.split(" ")[0];
  let sourceClass: Class = FindClass(source, classes);
  let sourceMultiplicity: string = line.split(" ")[1];
  let target: string = line.split(" ")[4];
  let targetClass: Class = FindClass(target, classes);
  let targetMultiplicity: string = line.split(" ")[3];
  let association: Association = {
    name: `Association_${source}_${target}`,
    source: {
      multiplicity: sourceMultiplicity
        ? sourceMultiplicity.replace(/"/g, "")
        : "",
      role: "",
      class: sourceClass,
      navagability: false,
    } as Endpoint,
    target: {
      multiplicity: targetMultiplicity
        ? targetMultiplicity.replace(/"/g, "")
        : "",
      role: "",
      class: targetClass,
      navagability: true,
    } as Endpoint,
  };
  return association;
  // associations.push(association);
};

/**
 * Processes an array of lines and generates a Model object containing classes and associations.
 *
 * @param lines - An array of strings representing the lines to process.
 * @returns A Model object containing classes and associations.
 */
const processAllLines = (lines: string[]): Model => {
  const classes: Class[] = [];
  const associations: Association[] = [];
  const classLinePattern = /^class(?!Diagram)/;
  const inheritanceLinePattern = /<\|--|--\|>/;
  const oneWayAssociationLinePattern = / --> /;

  lines.forEach((line, index) => {
    line = line.replace(/^\s*/, "");
    const noteLinePattern = /^note/;
    if (noteLinePattern.test(line)) {
      let currentClass: Class = handleClass(line);
      if (currentClass) {
        classes.push(currentClass);
      }
    }
    if (classLinePattern.test(line)) {
      let classname = line.split(" ")[1];
      let attributeLines: string[] = readAttributeLines(index, lines);
      let currentClass: Class = FindClass(classname, classes);
      currentClass = loadClassAttributes(currentClass, attributeLines);
    }
    const abstractLinePattern = /<<Abstract>>/;
    if (abstractLinePattern.test(line)) {
      let classname: string = line.split(" ")[1];
      let classToUpdate: Class = FindClass(classname, classes);
      classToUpdate.isAbstract = true;
    }

    if (inheritanceLinePattern.test(line)) {
      processInheritanceLine(line, classes);
    }

    if (oneWayAssociationLinePattern.test(line)) {
      const association: Association = processOneWayAssociationLine(
        line,
        classes
      );
      associations.push(association);
    }
  });
  const model: Model = { modeldate: new Date(), classes, associations };
  return model;
};
const processFile = (filePath: string): Model => {
  const pattern: RegExp = /^[\s\t]+/;
  let lines: string[] = readFileLines(filePath).filter((line: string) =>
    pattern.test(line)
  );
  return processAllLines(lines);
};

export const genModel = (filePath: string, genModelPath: string) => {
  let model: Model = processFile(filePath);
  serializeClassesToJson(model, genModelPath);
};

const testModel = (genModelPath: string) => {
  let model: Model = deserializeJsonToClasses(genModelPath);
  printModel(model);
};

const main = () => {
  console.log(Date.now());
  const filePath = "./mermaid/model.md";
  const genModelPath = "./output/genModel.json";
  genModel(filePath, genModelPath);
  testModel(genModelPath);
};

main();
