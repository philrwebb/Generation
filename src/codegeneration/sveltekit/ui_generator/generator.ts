import path from "path";
import {
    Class,
    Attribute,
    Association,
    deserializeJsonToClasses,
    ModelTypeToCodeType,
    getRefDataAssociationsForClass,
    getCollectionAssociationsForClass,
    pluralize,
    camelCaseToTitleCase,
} from "../../../genmodel";
import * as fs from "fs";

const genModelPath = "./output/genModel.json";
const outputRoot = "./output/sveltekit/client/src";
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
            getRefDataAssociationsForClass(c.parent, model),
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
        schemaContent += `z.number().int().positive(),\n`;
    }
    return schemaContent;
};
// const buildZodSchemas = (
//     c: Class,
//     refDataAssociations: Association[],
//     collectionAssociations: Association[]
// ): string => {
//     let schemaContent = "";

//     schemaContent += doSchemaAttributes(c, schemaContent);
//     let schemaContentAssociations = doSchemaRefDataAssociations(
//         c,
//         refDataAssociations,
//         ""
//     );
//     let schemaContentCollectionAssociations = doSchemaCollectionAssociations(
//         c,
//         collectionAssociations,
//         ""
//     );
//     let schemaContentTop = `import { z } from 'zod';\n\n`;
//     schemaContentTop += `export const Create${c.name}Schema = z.object({\n`;
//     schemaContent =
//         schemaContentTop +
//         schemaContent +
//         schemaContentAssociations +
//         schemaContentCollectionAssociations;
//     schemaContent += "});\n\n";

//     schemaContent += `export type Create${c.name}Dto = z.infer<typeof Create${c.name}Schema>;\n\n`;
//     return schemaContent;
// };
// const buildtypes = (
//     c: Class,
//     refDataAssociations: Association[],
//     collectionAssociations: Association[]
// ): string => {
//     let typeContent = "";

//     if (c.parent?.name !== undefined) {
//         typeContent += `import { ${c.parent?.name} } from '../${c.parent?.namespace}/${c.parent?.name}';\n\n`;
//         typeContent += `export interface ${c.name} extends ${c.parent?.name} {\n`;
//     } else {
//         typeContent += `export interface ${c.name} {\n`;
//     }
//     for (const a of c.attributes) {
//         typeContent += `  ${a.name}: ${ModelTypeToCodeType(
//             a.type,
//             "typescript"
//         )};\n`;
//     }
//     typeContent += "}\n";
//     return typeContent;
// };
const buildapitsrowsForClass = (c: Class): string => {
    if (c.isAbstract) {
        return "";
    }
    let apitsContent = "";

    apitsContent += `export const get${pluralize(c.name)} = () =>  api.get('/${
        c.name
    }');\n`;
    apitsContent +=
        `export const get${c.name}ById = (id: number) =>  api.get(` +
        "`" +
        `/${c.name}/` +
        "${id}`" +
        `);\n`;
    apitsContent += `export const create${c.name} = (data: any) =>  api.post('/${c.name}', data);\n`;
    apitsContent +=
        `export const update${c.name} = (id: number, data: any) =>  api.put(` +
        "`" +
        `/${c.name}/` +
        "${id}`" +
        ", data);\n";
    apitsContent +=
        `export const delete${c.name} = (id: number) =>  api.delete(` +
        "`" +
        `/${c.name}/` +
        "${id}`" +
        ");\n";
    apitsContent += `\n`;
    return apitsContent;
};
const doTypeAttributes = (
    c: Class,
    r: Association[],
    typeContent: string = ""
): string => {
    if (c.parent?.name !== undefined) {
        typeContent += doTypeAttributes(
            c.parent,
            getRefDataAssociationsForClass(c.parent, model),
            typeContent
        );
    }
    for (const a of c.attributes) {
        let type = ModelTypeToCodeType(a.type, "typescript");
        if (
            !(
                type === "number" ||
                type === "boolean" ||
                type === "date" ||
                type === "datetime"
            )
        )
            type = "string";
        typeContent += `  ${a.name}${
            type === "boolean" ? "?" : ""
        }: ${type};\n`;
    }
    for (const a of r) {
        typeContent += `  ${a.target.class.name}id: number;\n`;
    }
    return typeContent;
};
const buildtypesForClass = (c: Class, r: Association[]): string => {
    let typeContent = "";

    if (c.isAbstract) {
        return "";
    }
    typeContent += `export interface ${c.name}\n`;
    typeContent += "{\n";
    typeContent += doTypeAttributes(c, r);
    typeContent += "}\n";
    return typeContent;
};
const buildLayoutMenuContentForClass = (c: Class): string => {
    let layoutMenuContent = "";
    layoutMenuContent += `<li class="menu-item">\n`;
    layoutMenuContent += `  <a href="/${c.name.toLowerCase()}" class="menu-link">${pluralize(
        c.name
    )}</a>\n`;
    layoutMenuContent += `</li>\n`;
    return layoutMenuContent;
};
const buildpageplustsContent = (c: Class, r: Association[]): string => {
    if (c.isAbstract) {
        return "";
    }
    const templatePath = path.join(__dirname, "../templates/plusPage.ts");
    let templateContent = fs.readFileSync(templatePath, "utf8");
    let typeImports = ` ${c.name}`;
    let apiImports = `get${pluralize(c.name)}`;
    let responses = ` ${c.name.toLowerCase()}Response`;
    let promises = `get${pluralize(c.name)}()`;
    let statuscheck = `${c.name.toLowerCase()}Response.status === 200`;
    let assignments = `const ${c.name.toLowerCase()}: ${
        c.name
    }[] = ${c.name.toLowerCase()}Response.data;\n`;
    let returns = `${c.name.toLowerCase()}`;
    if (r.length > 0) {
        for (const a of r) {
            typeImports += `, ${a.target.class.name}`;
            apiImports += `, get${pluralize(a.target.class.name)}`;
            responses += `, ${a.target.class.name.toLowerCase()}Response`;
            promises += `, get${pluralize(a.target.class.name)}()`;
            statuscheck += ` && ${a.target.class.name.toLowerCase()}Response.status === 200`;
            assignments += `\nconst ${a.target.class.name.toLowerCase()}: ${
                a.target.class.name
            }[] = ${a.target.class.name.toLowerCase()}Response.data;\n`;
            returns += `, ${a.target.class.name.toLowerCase()}`;
        }
    }
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    templateContent = templateContent.replace("{{apiImports}}", apiImports);
    templateContent = templateContent.replace("{{responses}}", responses);
    templateContent = templateContent.replace("{{promises}}", promises);
    templateContent = templateContent.replace("{{statuscheck}}", statuscheck);
    templateContent = templateContent.replace("{{assignments}}", assignments);
    templateContent = templateContent.replace("{{returns}}", returns);
    return templateContent;
};
const buildtypesveltemainContent = (c: Class, r: Association[]): string => {
    if (c.isAbstract) {
        return "";
    }
    const templatePath = path.join(__dirname, "../templates/+page.svelte");
    let templateContent = fs.readFileSync(templatePath, "utf8");
    let typeImports = ` ${c.name}`;
    for (const a of r) {
        typeImports += `, ${a.target.class.name}`;
    }
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    let apiImports = `delete${c.name}`;
    templateContent = templateContent.replace("{{apiImports}}", apiImports);
    let assignments = `let ${pluralize(c.name).toLowerCase()}: ${
        c.name
    }[] = data.${c.name.toLowerCase()};\n`;
    for (const a of r) {
        assignments += `let ${pluralize(a.target.class.name).toLowerCase()}: ${
            a.target.class.name
        }[] = data.${a.target.class.name.toLowerCase()};\n`;
    }
    templateContent = templateContent.replace("{{assignments}}", assignments);
    let classlowertext = c.name.toLowerCase();
    templateContent = templateContent.replace(
        "{{classlowertext}}",
        classlowertext
    );
    let classuppertext = c.name;
    templateContent = templateContent.replace(
        new RegExp("{{classuppertext}}", "g"),
        classuppertext
    );
    let deletelogic = `${pluralize(c.name).toLowerCase()} = ${pluralize(
        c.name
    ).toLowerCase()}.filter((item) => item.id !== id);\n`;
    templateContent = templateContent.replace("{{deleteLogic}}", deletelogic);
    let getrefdatalogic = "";
    for (const a of r) {
        getrefdatalogic += `function get${a.target.class.name}Description(id: number): string{\n`;
        getrefdatalogic += `  const item = ${pluralize(
            a.target.class.name.toLowerCase()
        )}.find((item) => item.id === id);\n`;
        getrefdatalogic += `  return item ? item.typeLongDescription : '';\n`;
        getrefdatalogic += `}\n`;
    }
    templateContent = templateContent.replace(
        "{{getRefDataLogic}}",
        getrefdatalogic
    );
    let html = generateHtmlForClass(c, r);
    templateContent = templateContent.replace("{{html}}", html);
    let variablestyle = "";
    let totalwidthitems = c.attributes.length + r.length + 2;
    templateContent = templateContent.replace(
        "{{noOfCols}}",
        `${totalwidthitems}`
    );
    for (let i = 1; i <= totalwidthitems; i++) {
        variablestyle += `  .grid-item:nth-child(${
            totalwidthitems * 2
        }n + ${i}),\n`;
    }
    variablestyle = variablestyle.replace(/,\n$/, "\n");
    variablestyle += `   {
       background-color: grey;
    }\n`;
    for (let i = 1; i <= totalwidthitems; i++) {
        variablestyle += `  .grid-item:nth-child(${totalwidthitems * 2}n + ${
            i + totalwidthitems
        }),\n`;
    }
    variablestyle = variablestyle.replace(/,\n$/, "\n");
    variablestyle += `   {
       background-color: white;
    }\n`;
    templateContent = templateContent.replace(
        "{{variablestyle}}",
        variablestyle
    );
    return templateContent;
};
const buildpluspagetseditContent = (c: Class, r: Association[]): string => {
    if (c.isAbstract) {
        return "";
    }
    const templatePath = path.join(__dirname, "../templates/edit/+page.ts");
    let templateContent = fs.readFileSync(templatePath, "utf8");
    let typeImports = ` ${c.name}`;
    let apiImports = `get${c.name}ById`;
    let responses = ` ${c.name.toLowerCase()}Response`;
    let promises = `get${c.name}ById(id)`;
    let statuscheck = `${c.name.toLowerCase()}Response.status === 200`;
    let assignments = `const ${c.name.toLowerCase()}: ${
        c.name
    } = ${c.name.toLowerCase()}Response.data;\n`;
    let returns = `${c.name.toLowerCase()}`;
    if (r.length > 0) {
        for (const a of r) {
            typeImports += `, ${a.target.class.name}`;
            apiImports += `, get${pluralize(a.target.class.name)}`;
            responses += `, ${a.target.class.name.toLowerCase()}Response`;
            promises += `, get${pluralize(a.target.class.name)}()`;
            statuscheck += ` && ${a.target.class.name.toLowerCase()}Response.status === 200`;
            assignments += `\nconst ${a.target.class.name.toLowerCase()}: ${
                a.target.class.name
            }[] = ${a.target.class.name.toLowerCase()}Response.data;\n`;
            returns += `, ${a.target.class.name.toLowerCase()}`;
        }
    }
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    templateContent = templateContent.replace("{{apiImports}}", apiImports);
    templateContent = templateContent.replace("{{responses}}", responses);
    templateContent = templateContent.replace("{{promises}}", promises);
    templateContent = templateContent.replace("{{statuscheck}}", statuscheck);
    templateContent = templateContent.replace("{{assignments}}", assignments);
    templateContent = templateContent.replace("{{returns}}", returns);
    return templateContent;
};
const buildpluspagesvelteeditContent = (c: Class, r: Association[]): string => {
    if (c.isAbstract) {
        return "";
    }
    const templatePath = path.join(__dirname, "../templates/edit/+page.svelte");
    let templateContent = fs.readFileSync(templatePath, "utf8");
    let typeImports = ` ${c.name}`;
    for (const a of r) {
        typeImports += `, ${a.target.class.name}`;
    }
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    let apiImports = `update${c.name}`;
    templateContent = templateContent.replace("{{apiImports}}", apiImports);
    let assignments = `let ${c.name.toLowerCase()}: ${
        c.name
    } = data.${c.name.toLowerCase()};\n`;
    for (const a of r) {
        assignments += `let ${pluralize(a.target.class.name).toLowerCase()}: ${
            a.target.class.name
        }[] = data.${a.target.class.name.toLowerCase()};\n`;
    }
    templateContent = templateContent.replace("{{assignments}}", assignments);
    let classlowertext = c.name.toLowerCase();
    templateContent = templateContent.replace(
        new RegExp("{{classlowertext}}", "g"),
        classlowertext
    );

    let classuppertext = c.name;
    templateContent = templateContent.replace(
        new RegExp("{{classuppertext}}", "g"),
        classuppertext
    );

    let html = generateHtmlForEdit(c, r);
    templateContent = templateContent.replace("{{html}}", html);
    let totalwidthitems = c.attributes.length + r.length + 2;
    templateContent = templateContent.replace(
        "{{noOfCols}}",
        `${totalwidthitems}`
    );
    return templateContent;
};

let apitsContent = `import axios from 'axios';\n`;
apitsContent += `import { PUBLIC_API_BASE_URL } from '$env/static/public';\n`;
apitsContent += `const api = axios.create({ baseURL: PUBLIC_API_BASE_URL });\n\n`;
let typeContent = `/* eslint-disable @typescript-eslint/no-empty-object-type */\n`;
typeContent += `// src/lib/types.ts\n\n`;
const typepageplustsContent: { [key: string]: string } = {};
const typesveltemainContent: { [key: string]: string } = {};
const typespluspagetseditContent: { [key: string]: string } = {};
const typespluspagesvelteeditContent: { [key: string]: string } = {};
let mainLayoutMenuContent = "";

for (const c of model.classes) {
    // Generate api.ts content
    if (!c.isAbstract) {
        apitsContent += buildapitsrowsForClass(c);
        mainLayoutMenuContent += buildLayoutMenuContentForClass(c);
    }
    const refDataAssociations = getRefDataAssociationsForClass(c, model);
    // find 1 to * (e.g. class with collections)
    const collectionAssociations = getCollectionAssociationsForClass(c, model);

    // Generate types content and write to src/lib/types.ts
    typeContent += buildtypesForClass(c, refDataAssociations);
    if (!c.isAbstract) {
        typepageplustsContent[c.name] = buildpageplustsContent(
            c,
            refDataAssociations
        );
        typesveltemainContent[c.name] = buildtypesveltemainContent(
            c,
            refDataAssociations
        );
        typespluspagetseditContent[c.name] = buildpluspagetseditContent(
            c,
            refDataAssociations
        );
        typespluspagesvelteeditContent[c.name] = buildpluspagesvelteeditContent(
            c,
            refDataAssociations
        );
    }
}
let filePath = outputRoot + "/lib";
if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
}
fs.writeFileSync(filePath + "/api.ts", apitsContent, "utf8");
fs.writeFileSync(filePath + "/types.ts", typeContent, "utf8");
const templatePath = path.join(__dirname, "../templates/routeLayout.svelte");
let templateContent = fs.readFileSync(templatePath, "utf8");
templateContent = templateContent.replace(
    "{{menuitems}}",
    mainLayoutMenuContent
);
fs.writeFileSync(outputRoot + "/routes/layout.svelte", templateContent, "utf8");

for (const c of model.classes) {
    if (!c.isAbstract) {
        filePath = outputRoot + "/routes/" + c.name.toLowerCase();
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(
            filePath + "/+page.ts",
            typepageplustsContent[c.name],
            "utf8"
        );
        fs.writeFileSync(
            filePath + "/+page.svelte",
            typesveltemainContent[c.name],
            "utf8"
        );
        filePath =
            outputRoot + "/routes/" + c.name.toLowerCase() + "/[id]/edit";
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(
            filePath + "/+page.ts",
            typespluspagetseditContent[c.name],
            "utf8"
        );
        fs.writeFileSync(
            filePath + "/+page.svelte",
            typespluspagesvelteeditContent[c.name],
            "utf8"
        );
    }
}
function generateHtmlForEdit(c: Class, r: Association[]) {
    let html = `<h1 class="my-6 text-center text-2xl font-bold">Edit ${c.name}</h1>\n`;
    html += `<form on:submit|preventDefault={save${c.name}} class="grid grid-cols-2 gap-4">\n`;
    for (const a of c.attributes) {
        let div = `   <div class="flex items-center">\n`;
        div += `      <label for=${a.name} class="w-1/3">${camelCaseToTitleCase(
            a.name
        )}:</label>\n`;
        div += `      <input id=${a.name} type=${ModelTypeToCodeType(
            a.type,
            "html"
        )} bind:value={${c.name.toLowerCase()}.${
            a.name
        }} class="w-2/3 rounded border border-gray-300 p-2"/>\n`;
        div += `   </div>\n`;
        html += div;
    }
    for (const a of r) {
        let div = `   <div class="flex items-center">\n`;
        div += `      <label for="${
            a.target.class.name
        }" class="w-1/3">${camelCaseToTitleCase(
            a.target.class.name
        )}:</label>\n`;
        div += `      <select\n`;
        div += `         id="${a.target.class.name}"\n`;
        div += `         bind:value={${c.name.toLowerCase()}.${
            a.target.class.name
        }id}\n`;
        div += `         class="w-2/3 rounded border border-gray-300 p-2"\n`;
        div += `      >\n`;
        div += `         {#each ${pluralize(
            a.target.class.name.toLowerCase()
        )} as item}\n`;
        div += `            <option value={item.id}>{item.typeLongDescription}</option>\n`;
        div += `         {/each}\n`;
        div += `      </select>\n`;
        div += `   </div>\n`;
        html += div;
    }
    let div = `<div class="col-span-2 flex justify-between">\n`;
    div += `   <button type="submit" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"\n`;
    div += `      >Save</button\n`;
    div += `   >\n`;
    div += `   <button\n`;
    div += `      type="button"\n`;
    div += `      on:click={() => goto('/${c.name.toLowerCase()}')}\n`;
    div += `      class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-700">Cancel</button\n`;
    div += `   >\n`;
    div += `</div>\n`;
    html += div;
    html += `</form>`;
    return html;
}
function generateHtmlForClass(c: Class, r: Association[]) {
    let html = `<h1 class="my-6 text-center text-2xl font-bold">${c.name}</h1>\n`;

    html += '<div class="grid-container">\n';
    html += `  <div class="grid-header">ID</div>\n`;
    for (const a of c.attributes) {
        html += `  <div class="grid-header">${a.name}</div>\n`;
    }
    for (const a of r) {
        html += `  <div class="grid-header">${a.target.class.name}</div>\n`;
    }
    html += `  <div class="grid-header">Actions</div>\n`;
    html += `  {#each ${pluralize(
        c.name
    ).toLowerCase()} as ${c.name.toLowerCase()}}\n`;
    html += `  <div class='grid-item'>{${c.name.toLowerCase()}.id}</div>\n`;
    for (const a of c.attributes) {
        if (a.type === "date") {
            html += `  <div class="grid-item">{new Date(${c.name.toLowerCase()}.${
                a.name
            }).toLocaleDateString().slice(0,10)}</div>\n`;
        } else {
            html += `  <div class="grid-item">{${c.name.toLowerCase()}.${
                a.name
            }}</div>\n`;
        }
    }
    for (const a of r) {
        html += `  <div class="grid-item">{get${
            a.target.class.name
        }Description(${c.name.toLowerCase()}.${
            a.target.class.name
        }id)}</div>\n`;
    }
    html += `  <div class="grid-item flex items-center space-x-2">\n`;
    html += `    <a href="/${c.name.toLowerCase()}/{${c.name.toLowerCase()}.id}/edit" class="mr-2">\n`;
    html += `    <button class="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-700">Edit</button>\n`;
    html += `    </a>\n`;
    html += `    <button on:click={() => remove${
        c.name
    }(${c.name.toLowerCase()}.id)} class="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700">Delete</button>\n`;
    html += `  </div>\n`;
    html += `  {/each}\n`;
    html += `</div>\n`;
    html += `<div class="mt-4 flex justify-center">\n`;
    html += `  <a href="/${c.name.toLowerCase()}/create" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">\n`;
    html += `    Add New ${c.name}\n`;
    html += `  </a>\n`;
    html += `</div>\n`;
    return html;
}
