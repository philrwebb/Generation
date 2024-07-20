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
} from "./genmodel";

/**
 * Processes an array of lines and generates a Model object containing classes and associations.
 *
 * @param lines - An array of strings representing the lines to process.
 * @returns A Model object containing classes and associations.
 */
const processLines = (lines: string[]): Model => {
  const classes: Class[] = [];
  const associations: Association[] = [];

  lines.forEach((line, index) => {
    line = line.replace(/^\s*/, "");
    if (line.startsWith("note")) {
      const tokens = line.split(" ");
      let className = tokens[2];
      let attributestoken = tokens[3].replace(/"/g, "");
      let attributes = attributestoken.split(",");
      let inheritance: Inheritance = Inheritance.none;
      if (attributes.length > 1) {
        inheritance = attributes[0].split("=")[1] as Inheritance;
      }
      let namespace = attributes.length > 1 ? attributes[1].split("=")[1] : "";
      let currentClass: Class = {
        name: className,
        inheritance: inheritance,
        namespace: namespace,
        parent: {} as Class,
        attributes: [],
        isAbstract: false,
      };
      classes.push(currentClass);
    }
    if (line.startsWith("class") && !line.startsWith("classDiagram")) {
      let classname = line.split(" ")[1];
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
      attributeLines.forEach((attributeLine: string) => {
        attributeLine = attributeLine.replace(/^[^a-zA-Z0-9\+\-]+/, "");
        let attrname = attributeLine.split(" ")[1];
        if (attrname.indexOf(":") > 0)
          attrname = attributeLine.split(" ")[1].split(":")[0];
        let attrtype = attributeLine.split(" ")[0];
        let attrlen = 0;
        if (attrtype.indexOf(":") > 0) {
          attrtype = attrtype.split(":")[0];
          attrlen = parseInt(attributeLine.split(":")[1]);
        }
        let currentClass: Class = classes.find(
          (c) => c.name === classname
        ) as Class;
        let attribute: Attribute = {
          name: attrname,
          type: attrtype.substring(1),
          length: attrlen,
          precision: 0,
          visibility:
            attrtype.substring(0, 1) === "+"
              ? Visibility.Public
              : attrtype.substring(0, 1) === "-"
              ? Visibility.Private
              : attrtype.substring(0, 1) === "#"
              ? Visibility.Protected
              : Visibility.Public,
        };
        currentClass.attributes.push(attribute);
      });
    }
    if (line.startsWith("<<Abstract>>")) {
      let classname = line.split(" ")[1];
      let classToUpdate = classes.find((c) => c.name === classname) as Class;
      classToUpdate.isAbstract = true;
    }
    if (line.includes("<|--")) {
      let parent = line.split(" ")[0];
      let child = line.split(" ")[2];
      let classToUpdate = classes.find((c) => c.name === child) as Class;
      let classToAssignAsParent = classes.find((c) => c.name === parent) as Class;
      classToUpdate.parent = classToAssignAsParent;
    }
    if (line.includes(" --> ")) {
      let source = line.split(" ")[0];
      let sourceClass = classes.find((c) => c.name === source) as Class;
      let sourceMultiplicity = line.split(" ")[1];
      let target = line.split(" ")[4];
      let targetClass = classes.find((c) => c.name === target) as Class;
      let targetMultiplicity = line.split(" ")[3];
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
  return processLines(lines);
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
