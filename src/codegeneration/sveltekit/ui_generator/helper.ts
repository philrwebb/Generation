import {
    Class,
    Association,
    pluralize,
    getRefDataAssociationsForClass,
    ModelTypeToCodeType,
    getClassAndParentAttributes,
    getNavigableAssociationsForClass,
    camelCaseToTitleCase,
} from "../../../genmodel";

/* $lib/api.ts
    Build_api_ts_rows_for_class generates the api.ts rows for a class
    @param c: Class
    @returns string

*/
export const Build_api_ts_rows_for_class = (c: Class): string => {
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
/* +layout.server.ts
    Build_layout_server_ts generates the layout.server.ts file content
    @param refDataClasses: Class[]
    @param template: string
    @returns string
*/
export const Build_layout_server_ts = (
    refDataClasses: Class[],
    template: string
): string => {
    let apiImports = "";
    let typeImports = "";
    let referenceBaseTypeDeclaration = "";
    let responses = "";
    let promises = "";
    let statuscheck = "";
    let assignments = "";
    for (const rdc of refDataClasses) {
        if (apiImports == "") {
            apiImports += `get${pluralize(rdc.name)}`;
            typeImports += `${rdc.name}`;
            referenceBaseTypeDeclaration += `${rdc.name}`;
            responses += `${rdc.name.toLowerCase()}Response`;
            promises += `get${pluralize(rdc.name)}()`;
            statuscheck += `${rdc.name.toLowerCase()}Response.status === 200`;
            assignments += `ReferenceData['${pluralize(
                rdc.name
            ).toLowerCase()}'] = ${rdc.name.toLowerCase()}Response.data;\n`;
        } else {
            apiImports += `, get${pluralize(rdc.name)}`;
            typeImports += `, ${rdc.name}`;
            referenceBaseTypeDeclaration += ` | ${rdc.name}`;
            responses += `, ${rdc.name.toLowerCase()}Response`;
            promises += `,\nget${pluralize(rdc.name)}()`;
            statuscheck += ` && ${rdc.name.toLowerCase()}Response.status === 200`;
            assignments += `ReferenceData['${pluralize(
                rdc.name
            ).toLowerCase()}'] = ${rdc.name.toLowerCase()}Response.data;\n`;
        }
    }
    template = template = template.replace("{{apiImports}}", apiImports);
    template = template.replace("{{typeImports}}", typeImports);
    template = template.replace(
        "{{referenceBaseTypeDeclaration}}",
        referenceBaseTypeDeclaration
    );
    template = template.replace("{{responses}}", responses);
    template = template.replace("{{promises}}", promises);
    template = template.replace("{{statuscheck}}", statuscheck);
    template = template.replace("{{assignments}}", assignments);
    console.log(template);
    return template;
};
/* Used by Build_Types_For_Class
   Do_Type_Attributes generates the type attributes for a class
    @param c: Class
    @param r: Association[]
    @param ma: Association[]
    @param typeContent: string
    @returns string
*/
const Do_Type_Attributes = (
    c: Class,
    ma: Association[],
    r: Association[],
    typeContent: string = ""
): string => {
    if (c.parent?.name !== undefined) {
        typeContent += Do_Type_Attributes(
            c.parent,
            ma,
            getRefDataAssociationsForClass(c.parent, ma),
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
/* $lib/types.ts
    Build_Types_For_Class generates the type content for a class
    @param c: Class
    @param ma: Association[]
    @param r: Association[]
    @returns string
*/
export const Build_Types_For_Class = (
    c: Class,
    ma: Association[],
    r: Association[]
): string => {
    let typeContent = "";

    if (c.isAbstract) {
        return "";
    }
    typeContent += `export interface ${c.name}\n`;
    typeContent += "{\n";
    typeContent += Do_Type_Attributes(c, ma, r);
    typeContent += "}\n";
    return typeContent;
};
/* +layout.svelte
    Build_Layout_Menu_Content_For_Class generates the layout menu content for a class
    @param c: Class
    @returns string
*/
export const Build_Layout_Menu_Content_For_Class = (c: Class): string => {
    let layoutMenuContent = "";
    layoutMenuContent += `<li class="menu-item">\n`;
    layoutMenuContent += `  <a href="/${c.name.toLowerCase()}" class="menu-link">${pluralize(
        c.name
    )}</a>\n`;
    layoutMenuContent += `</li>\n`;
    return layoutMenuContent;
};
/* +page.server.ts
    Build_Page_Server_ts_Content generates the server.ts file content for a class
    @param c: Class
    @param r: Association[]
    @param templateContent: string
    @returns string
*/
export const Build_Page_Server_ts_Content = (
    c: Class,
    r: Association[],
    templateContent: string
): string => {
    if (c.isAbstract) {
        return "";
    }
    let typeImports = ` ${c.name}`;
    let apiImports = `get${pluralize(c.name)}`;
    let responses = ` ${c.name.toLowerCase()}Response`;
    let promises = `get${pluralize(c.name)}()`;
    let statuscheck = `${c.name.toLowerCase()}Response.status === 200`;
    let assignments = `const ${c.name.toLowerCase()}s: ${
        c.name
    }[] = ${c.name.toLowerCase()}Response.data;\n`;
    let returns = `${c.name.toLowerCase()}s`;
    apiImports += `, delete${c.name}`;
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    templateContent = templateContent.replace("{{apiImports}}", apiImports);
    templateContent = templateContent.replace("{{responses}}", responses);
    templateContent = templateContent.replace("{{promises}}", promises);
    templateContent = templateContent.replace("{{statuscheck}}", statuscheck);
    templateContent = templateContent.replace("{{assignments}}", assignments);
    templateContent = templateContent.replace("{{returns}}", returns);
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
    return templateContent;
};
/* +page.svelte
    Build_Page_Svelte_Main_For_Type_Content generates the svelte main content for a class
    @param c: Class
    @param r: Association[]
    @param templateContent: string
    @returns string
*/
export const Build_Svelte_Main_For_Type_Content = (
    c: Class,
    r: Association[],
    templateContent: string
): string => {
    if (c.isAbstract) {
        return "";
    }
    let typeImports = ` ${c.name}`;
    for (const a of r) {
        typeImports += `, ${a.target.class.name}`;
    }
    templateContent = templateContent.replace("{{typeImports}}", typeImports);
    templateContent = templateContent.replace("{{classuppertext}}", c.name);
    templateContent = templateContent.replace(
        "{{classlowertext}}",
        `${c.name.toLowerCase()}`
    );
    let assignments = "";

    for (const a of r) {
        assignments += `let ${pluralize(a.target.class.name).toLowerCase()}: ${
            a.target.class.name
        }[] = data.${a.target.class.name.toLowerCase()};\n`;
    }
    templateContent = templateContent.replace("{{assignments}}", assignments);
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
    let totalwidthitems = c.attributes.length + r.length + 2;
    templateContent = templateContent.replace(
        "{{noOfCols}}",
        `${totalwidthitems}`
    );
    return templateContent;
};
/* +page.svelte html
    generateHtmlForClass generates the html for a class
    @param c: Class
    @param r: Association[]
    @returns string
*/
const generateHtmlForClass = (c: Class, r: Association[]): string => {
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
};
/* [id]/+page.server.ts
    Build_Page_server_ts_Edit_Content generates the server.ts file content for a class in the Edit tree
    @param c: Class
    @param r: Association[]
    @param templateContent: string
    @returns string
*/
export const Build_Page_server_ts_Edit_Content = (
    c: Class,
    r: Association[],
    templateContent: string
): string => {
    if (c.isAbstract) {
        return "";
    }
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
/* [id]/+page.svelte
    Build_Page_Svelte_Edit_Content generates the svelte edit content for a class
    @param c: Class
    @param ma: Association[]
    @param r: Association[]
    @param templateContent: string
    @returns string
*/
export const Build_Page_Svelte_Edit_Content = (
    c: Class,
    ma: Association[],
    r: Association[],
    templateContent: string
): string => {
    if (c.isAbstract) {
        return "";
    }

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

    let html = generateHtmlForEdit(c, ma);
    templateContent = templateContent.replace("{{html}}", html);
    let totalwidthitems = c.attributes.length + r.length + 2;
    templateContent = templateContent.replace(
        "{{noOfCols}}",
        `${totalwidthitems}`
    );
    return templateContent;
};
/* [id]/+page.svelte html
    generateHtmlForEdit generates the html for the edit tree
    @param c: Class
    @param ma: Association[]
    @returns string
*/
const generateHtmlForEdit = (c: Class, ma: Association[] = []): string => {
    let html = `<h1 class="my-6 text-center text-2xl font-bold">Edit ${c.name}</h1>\n`;
    html += `<form on:submit|preventDefault={save${c.name}} class="grid grid-cols-2 gap-4">\n`;
    const attrs = getClassAndParentAttributes(c);
    const assocs = getNavigableAssociationsForClass(c, ma);
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
};
