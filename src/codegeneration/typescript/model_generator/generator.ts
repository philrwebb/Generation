import fs from "node:fs";
import path from "node:path";
import type { ModelAssociation, ModelAttribute, ModelClass, ModelType } from "../../../model/canonical-model";
import { loadModel } from "../../../model/load-model";
import { getAssociationTargetClass, getCollectionAssociations, getParent, getReferenceAssociations } from "../../../model/queries";
import type { ResolvedModel } from "../../../model/resolve-model";

export type GeneratedFile = { relativePath: string; content: string };

const typeScriptType = (type: ModelType): string => {
    switch (type.kind) {
        case "string": return "string";
        case "integer":
        case "decimal": return "number";
        case "boolean": return "boolean";
        case "date":
        case "dateTime": return "Date";
    }
};

const attributeType = (attribute: ModelAttribute): string => {
    const type = typeScriptType(attribute.type);
    return attribute.nullable ? `${type} | null` : type;
};

const attributeInitialValue = (attribute: ModelAttribute): string => {
    if (attribute.nullable) return "null";
    switch (attribute.type.kind) {
        case "string": return "''";
        case "integer":
        case "decimal": return "0";
        case "boolean": return "false";
        case "date":
        case "dateTime": return "new Date()";
    }
};

const associationRole = (association: ModelAssociation): string => {
    if (!association.target.role) throw new Error(`Association '${association.id}' has no target role.`);
    return association.target.role;
};

const importPath = (from: ModelClass, target: ModelClass): string =>
    from.namespace === target.namespace ? `./${target.name}` : `../${target.namespace}/${target.name}`;

export const renderTypeScriptClass = (model: ResolvedModel, modelClass: ModelClass): string => {
    const parent = getParent(model, modelClass);
    const references = getReferenceAssociations(model, modelClass);
    const collections = getCollectionAssociations(model, modelClass);
    const imports = new Map<string, string>();

    if (parent) imports.set(parent.id, `import { ${parent.name} } from '${importPath(modelClass, parent)}';`);
    for (const association of [...references, ...collections]) {
        const target = getAssociationTargetClass(model, association);
        if (target.id !== modelClass.id) imports.set(target.id, `import { ${target.name} } from '${importPath(modelClass, target)}';`);
    }

    let content = imports.size ? `${[...imports.values()].join("\n")}\n\n` : "";
    content += parent ? `export class ${modelClass.name} extends ${parent.name} {\n` : `export class ${modelClass.name} {\n`;

    for (const attribute of modelClass.attributes) {
        content += `  private _${attribute.name}: ${attributeType(attribute)} = ${attributeInitialValue(attribute)};\n`;
    }
    for (const association of references) {
        const target = getAssociationTargetClass(model, association);
        const role = associationRole(association);
        content += `  private _${role}: ${target.name} | null = null;\n`;
    }
    for (const association of collections) {
        const target = getAssociationTargetClass(model, association);
        const role = associationRole(association);
        content += `  private _${role}: ${target.name}[] = [];\n`;
    }

    content += "\n  constructor(...args: unknown[]) {\n";
    if (parent) content += "    super(...args);\n";
    content += "  }\n\n";
    content += "  toString(): string {\n";
    content += "    let result = `${this.constructor.name}:\\n`;\n";
    content += "    for (const [property, value] of Object.entries(this)) {\n";
    content += "      result += `   ${property} = ${String(value)}\\n`;\n";
    content += "    }\n    return result;\n  }\n\n";

    for (const attribute of modelClass.attributes) {
        const type = attributeType(attribute);
        content += `  public get ${attribute.name}(): ${type} {\n    return this._${attribute.name};\n  }\n\n`;
        content += `  public set ${attribute.name}(value: ${type}) {\n    this._${attribute.name} = value;\n  }\n\n`;
    }
    for (const association of references) {
        const target = getAssociationTargetClass(model, association);
        const role = associationRole(association);
        content += `  public get ${role}(): ${target.name} | null {\n    return this._${role};\n  }\n\n`;
        content += `  public set ${role}(value: ${target.name} | null) {\n    this._${role} = value;\n  }\n\n`;
    }
    for (const association of collections) {
        const target = getAssociationTargetClass(model, association);
        const role = associationRole(association);
        content += `  public get ${role}(): ${target.name}[] {\n    return this._${role};\n  }\n\n`;
        content += `  public set ${role}(value: ${target.name}[]) {\n    this._${role} = value;\n  }\n\n`;
    }

    content += "  public toJSON() {\n    return {\n";
    if (parent) content += "      ...super.toJSON(),\n";
    for (const attribute of modelClass.attributes) content += `      ${attribute.name}: this.${attribute.name},\n`;
    for (const association of [...references, ...collections]) {
        const role = associationRole(association);
        content += `      ${role}: this.${role},\n`;
    }
    content += "    };\n  }\n}\n";
    return content;
};

export const generateTypeScriptModels = (model: ResolvedModel): GeneratedFile[] =>
    model.document.classes.map((modelClass) => ({
        relativePath: path.join(modelClass.namespace, `${modelClass.name}.ts`),
        content: renderTypeScriptClass(model, modelClass),
    }));

export const writeGeneratedFiles = (outputRoot: string, files: readonly GeneratedFile[]): void => {
    for (const file of files) {
        const filePath = path.join(outputRoot, file.relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, "utf8");
    }
};

const main = (): void => {
    const [modelPath = "./output/canonical-model.json", outputRoot = "./output/typescript/model"] = process.argv.slice(2);
    writeGeneratedFiles(outputRoot, generateTypeScriptModels(loadModel(modelPath)));
};

if (require.main === module) main();
