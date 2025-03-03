import {
    Class,
    Attribute,
    Association,
    deserializeJsonToClasses,
    ModelTypeToCodeType,
    getRefDataAssociationsForClass,
    getCollectionAssociationsForClass,
    pluralize,
} from "../../../genmodel";
import * as fs from "fs";

const genModelPath = "./output/genModel.json";
const outputRoot = "./output/typescript/api";
const model = deserializeJsonToClasses(genModelPath);
if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
}
const doSchemaAttributes = (c: Class, schemaContent: string): string => {
    if (c.parent?.name !== undefined) {
        schemaContent += doSchemaAttributes(c.parent, schemaContent);
    }
    for (const a of c.attributes) {
        if (a.name === "id") {
            continue;
        }
        let zodType = ModelTypeToCodeType(a.type, "zod");
        schemaContent += `  ${a.name}: `;
        if (zodType === "date") {
            schemaContent += `z.preprocess((arg) => {\n`;
            schemaContent += `   if (typeof arg ==='string' || arg instanceof Date) {\n`;
            schemaContent += `     const date = new Date(arg);\n`;
            schemaContent += `     return isNaN(date.getTime()) ? undefined : date;\n`;
            schemaContent += `   }\n`;
            schemaContent += `   return undefined;\n`;
            schemaContent += `}, z.date({ required_error: "" })),\n`;
        } else {
            if (a.type === "int") {
                schemaContent += `z.number().int().positive(),\n`;
            } else {
                schemaContent += ` z.${zodType}(),\n`;
            }
        }
    }
    return schemaContent;
};
const doSchemaRefDataAssociations = (
    c: Class,
    refdataassociation: Association[],
    schemaContent: string = ""
): string => {
    if (c.parent?.name !== undefined) {
        schemaContent += doSchemaRefDataAssociations(
            c.parent,
            getRefDataAssociationsForClass(c.parent, model.associations),
            schemaContent
        );
    }
    for (const a of refdataassociation) {
        schemaContent += `  ${a.target.class.name}id: `;
        schemaContent += `z.number().int().positive(),\n`;
    }
    return schemaContent;
};
const doSchemaCollectionAssociations = (
    c: Class,
    collectionAssociations: Association[],
    schemaContent: string = ""
): string => {
    if (c.parent?.name !== undefined) {
        schemaContent += doSchemaCollectionAssociations(
            c.parent,
            getCollectionAssociationsForClass(c.parent, model),
            schemaContent
        );
    }
    for (const a of collectionAssociations) {
        schemaContent += `  ${a.source.class.name}id: `;
        schemaContent += `z.number().int().positive().optional(),\n`;
    }
    return schemaContent;
};
const buildZodSchemas = (
    c: Class,
    refDataAssociations: Association[],
    collectionAssociations: Association[]
): string => {
    let schemaContent = "";

    schemaContent += doSchemaAttributes(c, schemaContent);
    let schemaContentAssociations = doSchemaRefDataAssociations(
        c,
        refDataAssociations,
        ""
    );
    let schemaContentCollectionAssociations = doSchemaCollectionAssociations(
        c,
        collectionAssociations,
        ""
    );
    let schemaContentTop = `import { z } from 'zod';\n\n`;
    schemaContentTop += `export const Create${c.name}Schema = z.object({\n`;
    schemaContent =
        schemaContentTop +
        schemaContent +
        schemaContentAssociations +
        schemaContentCollectionAssociations;
    schemaContent += "});\n\n";

    schemaContent += `export type Create${c.name}Dto = z.infer<typeof Create${c.name}Schema>;\n\n`;
    return schemaContent;
};
const buildtypes = (
    c: Class,
    refDataAssociations: Association[],
    collectionAssociations: Association[]
): string => {
    let typeContent = "";

    if (c.parent?.name !== undefined) {
        typeContent += `import { ${c.parent?.name} } from '../${c.parent?.namespace}/${c.parent?.name}';\n\n`;
        typeContent += `export interface ${c.name} extends ${c.parent?.name} {\n`;
    } else {
        typeContent += `export interface ${c.name} {\n`;
    }
    for (const a of c.attributes) {
        typeContent += `  ${a.name}: ${ModelTypeToCodeType(
            a.type,
            "typescript"
        )};\n`;
    }
    typeContent += "}\n";
    return typeContent;
};
let routesContentimports = `import express from 'express';\n`;
routesContentimports += `import { createRoutesForType } from '../handlers/createRoutesForType';\n`;
routesContentimports += `import { FileRepository} from '../repositories/FileRepository';\n\n`;
let routesContent = `export const setupRoutes = (app: express.Application) => {\n`;

for (const c of model.classes) {
    const refDataAssociations = getRefDataAssociationsForClass(
        c,
        model.associations
    );
    // find 1 to * (e.g. class with collections)
    const collectionAssociations = getCollectionAssociationsForClass(c, model);
    let filePath;
    if (!c.isAbstract) {
        const schemaContent = buildZodSchemas(
            c,
            refDataAssociations,
            collectionAssociations
        );
        filePath = outputRoot + "/schemas/" + c.namespace;
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(
            filePath + "/" + c.name + ".ts",
            schemaContent,
            "utf8"
        );
    }
    const typeContent = buildtypes(
        c,
        refDataAssociations,
        collectionAssociations
    );
    filePath = outputRoot + "/types/model/" + c.namespace;
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + "/" + c.name + ".ts", typeContent, "utf8");
    if (c.isAbstract) {
        continue;
    }
    routesContentimports += `import { ${c.name} } from '../types/model/${c.namespace}/${c.name}';\n`;
    routesContentimports += `import { Create${c.name}Schema } from '../schemas/${c.namespace}/${c.name}';\n`;
    routesContent += `  createRoutesForType<${c.name}>(app, '${c.name}', Create${c.name}Schema, new FileRepository<${c.name}>('./data/${c.name}.json'));\n`;
}
let routesOutput = routesContentimports + "\n" + routesContent + "};\n";
let filePath = outputRoot + "/routes";
if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
}
fs.writeFileSync(filePath + "/setuproutes.ts", routesOutput, "utf8");
