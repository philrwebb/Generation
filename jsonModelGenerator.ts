import fs from "fs";
import { Class, Attribute, Association, Endpoint, Visibility, Inheritance, Model } from './genmodel';

const readFileLines = (filePath: string): string[] => {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split(/\r?\n/);
  const pattern = /^(class|[^`-])/;
  return lines.filter((line: string) => pattern.test(line));
};

const processLines = (lines: string[]): Model => {
  const classes: Class[] = [];
  const associations: Association[] = [];

  lines.forEach((line, index) => {
    line = line.replace(/^\s*/, "");
    if (line.startsWith("note")) {  
      const tokens = line.split(" ");
      let className = tokens[2];
      let attributestoken = tokens[3].replace(/"/g,'');
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
        parent: "",
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
        let attrtype = attributeLine.split(" ")[0];
        let currentClass: Class = classes.find(
          (c) => c.name === classname
        ) as Class;
        let attribute: Attribute = {
          name: attrname,
          type: attrtype.substring(1),
          length: 0,
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
      classToUpdate.parent = parent;
    }
    if (line.includes(" --> ")) {
      let source = line.split(" ")[0];
      let sourceMultiplicity = line.split(" ")[1];
      let target = line.split(" ")[4];
      let targetMultiplicity = line.split(" ")[3];
      let association: Association = {
        name: `Association_${source}_${target}`,
        source: {
          multiplicity: sourceMultiplicity ? sourceMultiplicity.replace(/"/g,'') : '',
          role: "",
          class: source,
          navagability: false,
        } as Endpoint,
        target: {
          multiplicity: targetMultiplicity ? targetMultiplicity.replace(/"/g,'') : '',
          role: "",
          class: target,
          navagability: true,
        } as Endpoint,
      };
      associations.push(association);
    }
  });
  const model: Model = { classes, associations };
  return model;
};
const printModel = (model: Model) => {
  model.classes.forEach((c) => {
    console.log(c);
    c.attributes.forEach((a) => {
      console.log(a);
    });
  });
  model.associations.forEach((a) => {
    console.log(a);
  });
};

const serializeClassesToJson = (model: Model, filePath: string) => {
  const jsonContent = JSON.stringify(model, null, 2);
  fs.writeFileSync(filePath, jsonContent, "utf8");
};

const deserializeJsonToClasses = (filePath: string): Model => {
  const jsonContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(jsonContent) as Model;
};

// Main function to execute the process
const main = () => {
  const filePath = "./mermaid/model.md"; // Path to the Mermaid markdown file
  const lines = readFileLines(filePath);
  let model = processLines(lines);
  serializeClassesToJson(model, "./output/classes.json");
  // printClasses(model.classes);
  console.log("Model json created successfully in /generators/output/classes.json");
  model = deserializeJsonToClasses("./output/classes.json");
  printModel(model);
};

main(); 
