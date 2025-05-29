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
} from "./genmodel";

const handleClass = (line: string): Class => {
    const pattern = /note for (\w+) "(?:inheritance=(\w+),)?namespace=(\w+)"/;
    const match = line.match(pattern);

    if (!match) {
        throw new Error("Line does not match the expected pattern");
    }

    const [, className, inheritance = "none", namespace] = match;

    return {
        name: className,
        inheritance: inheritance as Inheritance,
        namespace: namespace,
        parent: {} as Class,
        attributes: [],
        isAbstract: false,
    };
};

const readAttributeLines = (index: number, lines: string[]): string[] => {
    const attributeLines: string[] = [];
    let i = index + 1;
    while (i < lines.length && !lines[i].includes("}")) {
        attributeLines.push(lines[i]);
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
            const attribute: Attribute = {
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

    const parent = relationship === "<|--" ? class1 : class2;
    const child = relationship === "<|--" ? class2 : class1;

    const classToUpdate: Class = FindClass(child, classes);
    const classToAssignAsParent: Class = FindClass(parent, classes);
    classToUpdate.parent = classToAssignAsParent;
};

const processOneWayAssociationLine = (
    line: string,
    classes: Class[]
): Association => {
    console.log("Processing one-way association line:", line);

    const associationPattern =
        /^(?<sourceClass>\w+)\s+"(?<sourceMultiplicity>[*\d..]+)"\s+-->\s+"(?<targetMultiplicity>[*\d..]+)"\s+(?<targetClass>\w+)\s*:\s*(?<targetRole>\w*)$/;
    const match = line.match(associationPattern);

    if (!match || !match.groups) {
        throw new Error(`Could not parse association line: ${line}`);
    }

    const {
        sourceClass: sourceName,
        sourceMultiplicity,
        targetMultiplicity,
        targetClass: targetName,
        targetRole,
    } = match.groups;

    const sourceClassObj: Class = FindClass(sourceName, classes);
    const targetClassObj: Class = FindClass(targetName, classes);

    if (!sourceClassObj) {
        throw new Error(
            `Source class "${sourceName}" not found for association: ${line}`
        );
    }
    if (!targetClassObj) {
        throw new Error(
            `Target class "${targetName}" not found for association: ${line}`
        );
    }

    return {
        name: `Association_${sourceName}_${targetName}`,
        source: {
            multiplicity: sourceMultiplicity.replace(/"/g, ""),
            role: "", // Source role is not explicitly defined in this format
            class: sourceClassObj,
            navigability: false, // Assuming one-way, source is not navigable by default from target via this role
        } as Endpoint,
        target: {
            multiplicity: targetMultiplicity.replace(/"/g, ""),
            role: targetRole || "", // Ensure role is an empty string if not present
            class: targetClassObj,
            navigability: true,
        } as Endpoint,
    };
};

const processAllLines = (lines: string[]): Model => {
    const classes: Class[] = [];
    const associations: Association[] = [];
    const classLinePattern = /^class(?!Diagram)/;
    const inheritanceLinePattern = /<\|--|--\|>/;
    const oneWayAssociationLinePattern = / --> /;

    lines.forEach((line, index) => {
        line = line.trim();
        if (line.startsWith("note")) {
            const currentClass = handleClass(line);
            classes.push(currentClass);
        } else if (classLinePattern.test(line)) {
            const classname = line.split(" ")[1];
            const attributeLines = readAttributeLines(index, lines);
            const currentClass = FindClass(classname, classes);
            loadClassAttributes(currentClass, attributeLines);
        } else if (line.includes("<<Abstract>>")) {
            const classname = line.split(" ")[1];
            const classToUpdate = FindClass(classname, classes);
            classToUpdate.isAbstract = true;
        } else if (inheritanceLinePattern.test(line)) {
            processInheritanceLine(line, classes);
        } else if (oneWayAssociationLinePattern.test(line)) {
            const association = processOneWayAssociationLine(line, classes);
            associations.push(association);
        }
    });

    return { modeldate: new Date(), classes, associations };
};

const processFile = (filePath: string, readFile: Function): Model => {
    const lines = readFile(filePath).filter(
        (line: string) => line.trim().length > 0
    );
    return processAllLines(lines);
};

export const genModel = (
    filePath: string,
    genModelPath: string,
    readFile: Function,
    writeTheFile: Function
) => {
    const model = processFile(filePath, readFile);
    console.log(model, filePath, writeTheFile, readFile, readFileLines);
    writeTheFile(model, genModelPath);
};

const testModel = (
    genModelPath: string,
    readFile = deserializeJsonToClasses,
    print = printModel
) => {
    const model = readFile(genModelPath);
    print(model);
};

const main = () => {
    const args: string[] = process.argv.slice(2);
    if (args.length !== 2) {
        console.log(
            "Usage: ts-node src/jsonModelGenerator.ts <inputfile> <outputfile>"
        );
        return;
    }
    const [filePath, genModelPath] = args;
    genModel(filePath, genModelPath, readFileLines, serializeClassesToJson);
    testModel(genModelPath);
};

main();
