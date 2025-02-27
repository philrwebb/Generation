import fs from "fs";
import * as path from "path";

export type Class = {
    name: string;
    inheritance?: Inheritance;
    namespace?: string;
    parent?: Class;
    attributes: Attribute[];
    isAbstract: boolean;
};

export type Attribute = {
    name: string;
    type: string;
    length?: number;
    precision?: number;
    visibility: Visibility;
};

export type Association = {
    name?: string;
    source: Endpoint;
    target: Endpoint;
};

export type Endpoint = {
    multiplicity: "0" | "1" | "*" | "n";
    role?: string;
    fkWinner?: boolean;
    class: Class;
    navagability: boolean;
};

export enum Visibility {
    Public = "public",
    Private = "private",
    Protected = "protected",
}

export enum Inheritance {
    rollup = "rollup",
    propagateattributes = "propagateattributes",
    none = "none",
}

export type Model = {
    modeldate: Date;
    classes: Class[];
    associations: Association[];
};

export const serializeClassesToJson = (model: Model, filePath: string) => {
    const jsonContent = JSON.stringify(model, null, 2);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, jsonContent, "utf8");
};

export const deserializeJsonToClasses = (filePath: string): Model => {
    // console.log(`Execution path: ${process.cwd()}`);
    const jsonContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(jsonContent) as Model;
};

export const readFileLines = (filePath: string): string[] => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split(/\r?\n/);
    return lines;
};

export const printModel = (model: Model) => {
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

export const GetParentColumns = (
    inClass: Class,
    Attributes: Attribute[] = []
): Attribute[] => {
    if (inClass.parent) {
        Attributes = GetParentColumns(inClass.parent, Attributes);
    }
    if (inClass.attributes) Attributes = [...Attributes, ...inClass.attributes];
    return Attributes;
};

export const FindClass = (className: string, classes: Class[]): Class => {
    return classes.find((c) => c.name === className) as Class;
};

export const WriteFile = (
    folderPath: string,
    fileName: string,
    content: string
) => {
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, content, "utf8");
};

export const ModelTypeToCodeType = (
    modeltype: string,
    codeLanguage: string
): string => {
    if (modeltype === "string") {
        if (codeLanguage === "python") return "str";
        if (codeLanguage === "typescript") return "string";
        if (codeLanguage === "csharp") return "string";
        if (codeLanguage === "zod") return "string";
        if (codeLanguage === "html") return "text";
    }
    if (modeltype === "int") {
        if (codeLanguage === "python") return "int";
        if (codeLanguage === "typescript") return "number";
        if (codeLanguage === "csharp") return "int";
        if (codeLanguage === "zod") return "number";
        if (codeLanguage === "html") return "text";
    }
    if (modeltype === "bool") {
        if (codeLanguage === "python") return "bool";
        if (codeLanguage === "typescript") return "boolean";
        if (codeLanguage === "csharp") return "bool";
        if (codeLanguage === "zod") return "boolean";
        if (codeLanguage === "html") return "text";
    }
    if (modeltype === "datetime" || modeltype === "date") {
        if (codeLanguage === "python") return "date";
        if (codeLanguage === "typescript") return "Date";
        if (codeLanguage === "csharp") return "DateTime";
        if (codeLanguage === "zod") return "date";
        if (codeLanguage === "html") return "date";
    }
    if (modeltype === "date") {
        if (codeLanguage === "python") return "date";
        if (codeLanguage === "typescript") return "Date";
        if (codeLanguage === "csharp") return "DateTime";
        if (codeLanguage === "zod") return "date";
        if (codeLanguage === "html") return "date";
    }
    return modeltype;
};

export const pluralize = (word: string): string => {
    const irregulars: { [key: string]: string } = {
        man: "men",
        woman: "women",
        child: "children",
        tooth: "teeth",
        foot: "feet",
        mouse: "mice",
        goose: "geese",
        party: "Parties",
        person: "People",
        // Add more irregular nouns as needed
    };

    if (irregulars[word.toLowerCase()]) {
        return irregulars[word.toLowerCase()];
    }

    const pluralRules: { [key: string]: RegExp } = {
        es: /[sxz]$|[^aeiou]h$/,
        ies: /[^aeiou]y$/,
        ves: /(?:f|fe)$/,
    };

    if (pluralRules.es.test(word)) {
        return word + "es";
    }

    if (pluralRules.ies.test(word)) {
        return word.slice(0, -1) + "ies";
    }

    if (pluralRules.ves.test(word)) {
        return word.replace(/(?:f|fe)$/, "ves");
    }

    return word + "s";
};

export const getCollectionAssociationsForClass = (
    c: Class,
    model: Model
): Association[] => {
    return model.associations.filter(
        (a) =>
            (a.source.multiplicity === "0" || a.source.multiplicity === "1") &&
            a.target.multiplicity === "*" &&
            a.target.class.name === c.name // this class is the parent
    );
};

export const camelCaseToTitleCase = (str: string): string => {
    // Insert a space before each uppercase letter
    const result = str.replace(/([A-Z])/g, " $1");
    // Capitalize the first letter of the resulting string
    return result.charAt(0).toUpperCase() + result.slice(1);
};

export const getClassAndParentAttributes = (
    c: Class,
    a: Attribute[] = []
): Attribute[] => {
    // if (a.length === 0) console.log(c.name);
    if (c.parent && Object.keys(c.parent).length > 0) {
        a = getClassAndParentAttributes(c.parent, a);
    }
    return [...a, ...c.attributes];
};

export const getNavigableAssociationsForClass = (
    c: Class,
    allAssociations: Association[]
): Association[] => {
    // Get associations where the source is the class and navigability is true
    let associations = allAssociations.filter(
        (a) => a.source.class.name === c.name && a.target.navagability
    );
    // Recursively include associations from parent's chain if parent exists and is non-empty
    if (c.parent && Object.keys(c.parent).length > 0) {
        associations = [
            ...getNavigableAssociationsForClass(c.parent, allAssociations),
            ...associations,
        ];
    }
    return associations;
};

export const getRefDataAssociationsForClass = (
    c: Class,
    associations: Association[]
): Association[] => {
    return associations.filter(
        (a) =>
            a.source.multiplicity === "*" &&
            a.target.multiplicity === "1" &&
            a.source.class.name === c.name // this class is the parent
    );
};

export const GetRefDataClasses = (model: Model): Class[] => {
    const refDataClasses: Class[] = [];
    for (const c of model.classes) {
        if (
            c.parent &&
            Object.keys(c.parent).length > 0 &&
            c.parent.name === "ReferenceBase"
        ) {
            refDataClasses.push(c);
        }
    }
    return refDataClasses;
};
