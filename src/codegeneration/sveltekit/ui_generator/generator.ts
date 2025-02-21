import path from "path";
import {
    Class,
    Association,
    deserializeJsonToClasses,
    ModelTypeToCodeType,
    getRefDataAssociationsForClass,
    getCollectionAssociationsForClass,
    pluralize,
    camelCaseToTitleCase,
    getClassAndParentAttributes,
    getNavigableAssociationsForClass,
    GetRefDataClasses,
} from "../../../genmodel";
import {
    Build_api_ts_rows_for_class,
    Build_layout_server_ts,
    Build_Types_For_Class,
    Build_Layout_Menu_Content_For_Class,
    Build_Page_Server_ts_Content,
    Build_Svelte_Main_For_Type_Content,
} from "./helper";
import * as fs from "fs";

const genModelPath = "./output/genModel.json";
const outputRoot = "./output/sveltekit/client/src";
const model = deserializeJsonToClasses(genModelPath);

if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
}
// const buildtypesveltemainContent = (c: Class, r: Association[]): string => {
//     if (c.isAbstract) {
//         return "";
//     }
//     const templatePath = path.join(__dirname, "../templates/+page.svelte");
//     let templateContent = fs.readFileSync(templatePath, "utf8");
//     let typeImports = ` ${c.name}`;
//     for (const a of r) {
//         typeImports += `, ${a.target.class.name}`;
//     }
//     templateContent = templateContent.replace("{{typeImports}}", typeImports);
//     templateContent = templateContent.replace("{{classuppertext}}", c.name);
//     templateContent = templateContent.replace(
//         "{{classlowertext}}",
//         `${c.name.toLowerCase()}`
//     );
//     let assignments = "";

//     for (const a of r) {
//         assignments += `let ${pluralize(a.target.class.name).toLowerCase()}: ${
//             a.target.class.name
//         }[] = data.${a.target.class.name.toLowerCase()};\n`;
//     }
//     templateContent = templateContent.replace("{{assignments}}", assignments);
//     let getrefdatalogic = "";
//     for (const a of r) {
//         getrefdatalogic += `function get${a.target.class.name}Description(id: number): string{\n`;
//         getrefdatalogic += `  const item = ${pluralize(
//             a.target.class.name.toLowerCase()
//         )}.find((item) => item.id === id);\n`;
//         getrefdatalogic += `  return item ? item.typeLongDescription : '';\n`;
//         getrefdatalogic += `}\n`;
//     }
//     templateContent = templateContent.replace(
//         "{{getRefDataLogic}}",
//         getrefdatalogic
//     );
//     let html = generateHtmlForClass(c, r);
//     templateContent = templateContent.replace("{{html}}", html);
//     let totalwidthitems = c.attributes.length + r.length + 2;
//     templateContent = templateContent.replace(
//         "{{noOfCols}}",
//         `${totalwidthitems}`
//     );
//     return templateContent;
// };
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

    let html = generateHtmlForEdit(c);
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
const RefDataTypes = GetRefDataClasses(model);
const lsservertsTemplate = fs.readFileSync(
    path.join(__dirname, "../templates/+layout.server.ts"),
    "utf8"
);
const layoutserverts = Build_layout_server_ts(RefDataTypes, lsservertsTemplate);
fs.writeFileSync(
    outputRoot + "/routes/+layout.server.ts",
    layoutserverts,
    "utf8"
);

for (const c of model.classes) {
    // Generate api.ts content
    if (!c.isAbstract) {
        apitsContent += Build_api_ts_rows_for_class(c);
        mainLayoutMenuContent += Build_Layout_Menu_Content_For_Class(c);
    }
    const refDataAssociations = getRefDataAssociationsForClass(
        c,
        model.associations
    );
    const collectionAssociations = getCollectionAssociationsForClass(c, model);

    // Generate types content and write to src/lib/types.ts
    typeContent += Build_Types_For_Class(
        c,
        model.associations,
        refDataAssociations
    );
    if (!c.isAbstract) {
        typepageplustsContent[c.name] = Build_Page_Server_ts_Content(
            c,
            refDataAssociations
        );
        typesveltemainContent[c.name] = Build_Svelte_Main_For_Type_Content(
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
fs.writeFileSync(
    outputRoot + "/routes/+layout.svelte",
    templateContent,
    "utf8"
);

for (const c of model.classes) {
    if (!c.isAbstract) {
        filePath = outputRoot + "/routes/" + c.name.toLowerCase();
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(
            filePath + "/+page.server.ts",
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
function generateHtmlForEdit(c: Class) {
    let html = `<h1 class="my-6 text-center text-2xl font-bold">Edit ${c.name}</h1>\n`;
    html += `<form on:submit|preventDefault={save${c.name}} class="grid grid-cols-2 gap-4">\n`;
    const attrs = getClassAndParentAttributes(c);
    const assocs = getNavigableAssociationsForClass(c, model.associations);
    for (const a of attrs) {
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
    for (const a of assocs) {
        if (a.target.multiplicity === "1") {
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
    let html = `
<h1 class="my-6 text-center text-2xl font-bold">Person</h1>    
<div class="mb-4 flex items-center">
	<label for="showAll" class="mr-2">Show All:</label>
	<input id="showAll" type="checkbox" bind:checked={showAll} />
</div>
<div class="grid-container">\n
`;
    html += `  <div class="grid-header">ID</div>\n`;
    for (const a of c.attributes) {
        html += `  <div class="grid-header">${a.name}</div>\n`;
    }
    for (const a of r) {
        html += `  <div class="grid-header">${a.target.class.name}</div>\n`;
    }
    html += `  <div class="grid-header">Actions</div>\n`;
    html += `  {#each filteredActive() as item, index}\n`;
    html += `     {@render lineItem(index, item.active, item.id)}\n`;
    for (const a of c.attributes) {
        if (a.type === "date") {
            html += `  {@render lineItem(index, item.active, new Date(item.${a.name}).toLocaleDateString().slice(0,10))}\n`;
        } else {
            html += `  {@render lineItem(index, item.active, item.${a.name})}\n`;
        }
    }
    for (const a of r) {
        html += `  {@render lineItem(index, item.active, get${a.target.class.name}Description(item.${a.target.class.name}id))}\n`;
    }
    html += `
    		<div class="border border-gray-300 p-2 {index % 2 === 1 ? 'bg-gray-200' : ''} {item.active ? '' : 'text-red-500'} flex items-center space-x-2">
			<a href="/${c.name.toLowerCase()}/{item.id}/edit" class="mr-2">
				<button class="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-700">Edit</button>
			</a>
			<button
				onclick={(event) => {
					event.preventDefault();
					openDeleteModal(item.id);
				}}
				class="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
				disabled={!item.active}
			>
				Delete
			</button>
		</div>
    {/each}
</div>\n`;
    html += `
<div class="mt-4 flex justify-center">
	<a href="/${c.name.toLowerCase()}/create" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
		Add New Person
	</a>
</div>

{#snippet lineItem(index: number, active: boolean | undefined, displayValue: any)}
	<div
		class="border border-gray-300 p-2 {index % 2 === 1 ? 'bg-gray-200' : ''} {active
			? ''
			: 'text-red-500'}"
	>
		{displayValue}
	</div>
{/snippet}

{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
	>
		<div class="w-80 rounded bg-white p-6 shadow-lg">
			<p class="mb-6 text-center text-xl font-semibold">Delete?</p>
			<form method="POST" action="?/delete">
				<input type="hidden" name="id" value={deleteId} />
				<div class="flex justify-center gap-4">
					<button type="submit" class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700"
						>Yes</button
					>
					<button
						onclick={() => closeDeleteModal()}
						type="button"
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">No</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat({{noOfCols}}, 1fr);
		gap: 1px;
	}

	.grid-header {
		font-weight: bold;
		background-color: lightskyblue;
		padding: 0.5rem;
		border: 1px solid #ccc;
		text-align: center;
	}
</style>
`;
    return html;
}
