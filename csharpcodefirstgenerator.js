"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const model_1 = require("./model");
const readFileLines = (filePath) => {
    const fileContent = fs_1.default.readFileSync(filePath, "utf8");
    const lines = fileContent.split(/\r?\n/);
    const pattern = /^(class|[^`-])/;
    return lines.filter((line) => pattern.test(line));
};
const processLines = (lines) => {
    const classes = [];
    const associations = [];
    lines.forEach((line, index) => {
        line = line.replace(/^\s*/, "");
        if (line.startsWith("note")) {
            const tokens = line.split(" ");
            let className = tokens[2];
            let attributestoken = tokens[3].replace(/"/g, '');
            let attributes = attributestoken.split(",");
            let inheritance = attributes[0].split("=")[1];
            let namespace = attributes.length > 1 ? attributes[1].split("=")[1] : "";
            let currentClass = {
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
            let attributeLines = [];
            let i = index + 1;
            while (true) {
                let nextLine = lines[i];
                if (nextLine.includes("}")) {
                    break;
                }
                attributeLines.push(nextLine);
                i++;
            }
            attributeLines.forEach((attributeLine) => {
                attributeLine = attributeLine.replace(/^[^a-zA-Z0-9\+\-]+/, "");
                let attrname = attributeLine.split(" ")[1];
                let attrtype = attributeLine.split(" ")[0];
                let currentClass = classes.find((c) => c.name === classname);
                let attribute = {
                    name: attrname,
                    type: attrtype.substring(1),
                    length: 0,
                    precision: 0,
                    visibility: attrtype.substring(0, 1) === "+"
                        ? model_1.Visibility.Public
                        : attrtype.substring(0, 1) === "-"
                            ? model_1.Visibility.Private
                            : attrtype.substring(0, 1) === "#"
                                ? model_1.Visibility.Protected
                                : model_1.Visibility.Public,
                };
                currentClass.attributes.push(attribute);
            });
        }
        if (line.startsWith("<<Abstract>>")) {
            let classname = line.split(" ")[1];
            let classToUpdate = classes.find((c) => c.name === classname);
            classToUpdate.isAbstract = true;
        }
        if (line.includes("<|--")) {
            let parent = line.split(" ")[0];
            let child = line.split(" ")[2];
            let classToUpdate = classes.find((c) => c.name === child);
            classToUpdate.parent = parent;
        }
        if (line.includes(" --> ")) {
            let source = line.split(" ")[0];
            let sourceMultiplicity = line.split(" ")[1];
            let target = line.split(" ")[4];
            let targetMultiplicity = line.split(" ")[3];
            let association = {
                name: `Association_${source}_${target}`,
                source: {
                    multiplicity: sourceMultiplicity ? sourceMultiplicity.replace(/"/g, '') : '',
                    role: "",
                    class: source,
                    navagability: false,
                },
                target: {
                    multiplicity: targetMultiplicity ? targetMultiplicity.replace(/"/g, '') : '',
                    role: "",
                    class: target,
                    navagability: true,
                },
            };
            associations.push(association);
        }
    });
    const model = { classes, associations };
    return model;
};
const printModel = (model) => {
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
const serializeClassesToJson = (model, filePath) => {
    const jsonContent = JSON.stringify(model, null, 2);
    fs_1.default.writeFileSync(filePath, jsonContent, "utf8");
};
const deserializeJsonToClasses = (filePath) => {
    const jsonContent = fs_1.default.readFileSync(filePath, "utf8");
    return JSON.parse(jsonContent);
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
//# sourceMappingURL=csharpcodefirstgenerator.js.map