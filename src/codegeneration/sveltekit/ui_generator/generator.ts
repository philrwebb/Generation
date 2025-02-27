import path from "path";
import * as fs from "fs";
import {
    deserializeJsonToClasses,
    getRefDataAssociationsForClass,
    getCollectionAssociationsForClass,
    GetRefDataClasses,
} from "../../../genmodel";
import {
    Build_api_ts_rows_for_class,
    Build_layout_server_ts,
    Build_Types_For_Class,
    Build_Layout_Menu_Content_For_Class,
    Build_Page_Server_ts_Content,
    Build_Svelte_Main_For_Type_Content,
    Build_Page_server_ts_Edit_Content,
    Build_Page_Svelte_Edit_Content,
    Build__Page_server_ts_Create_Content,
    Build_Page_Svelte_Create_Content,
} from "./helper";

const genModelPath = "./output/genModel.json";
const outputRoot = "./output/sveltekit/client/src";

const model = deserializeJsonToClasses(genModelPath);

if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
}

let apitsContent = `
import axios from 'axios';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
const api = axios.create({ baseURL: PUBLIC_API_BASE_URL });
`;

let typeContent = `
/* eslint-disable @typescript-eslint/no-empty-object-type */
// src/lib/types.ts

`;
let mainLayoutMenuContent = "";
const RefDataTypes = GetRefDataClasses(model);
const typepageplustsContent: { [key: string]: string } = {};
const typesveltemainContent: { [key: string]: string } = {};
const typespluspagetseditContent: { [key: string]: string } = {};
const typespluspagesvelteeditContent: { [key: string]: string } = {};
const typespluspagetscreateContent: { [key: string]: string } = {};
const typespluspagesveltecreateContent: { [key: string]: string } = {};

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
    // const collectionAssociations = getCollectionAssociationsForClass(c, model);

    // Generate types content and write to src/lib/types.ts
    typeContent += Build_Types_For_Class(
        c,
        model.associations,
        refDataAssociations
    );
    if (!c.isAbstract) {
        let templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/+page.server.ts"),
            "utf8"
        );
        typepageplustsContent[c.name] = Build_Page_Server_ts_Content(
            c,
            refDataAssociations,
            templateContent
        );
        templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/+page.svelte"),
            "utf8"
        );
        typesveltemainContent[c.name] = Build_Svelte_Main_For_Type_Content(
            c,
            refDataAssociations,
            templateContent
        );
        templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/edit/+page.server.ts"),
            "utf8"
        );
        typespluspagetseditContent[c.name] = Build_Page_server_ts_Edit_Content(
            c,
            refDataAssociations,
            templateContent
        );
        templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/edit/+page.svelte"),
            "utf8"
        );
        typespluspagesvelteeditContent[c.name] = Build_Page_Svelte_Edit_Content(
            c,
            model.associations,
            refDataAssociations,
            templateContent
        );
        templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/create/+page.server.ts"),
            "utf8"
        );
        typespluspagetscreateContent[c.name] =
            Build__Page_server_ts_Create_Content(c, templateContent);
        templateContent = fs.readFileSync(
            path.join(__dirname, "../templates/create/+page.svelte"),
            "utf8"
        );
        typespluspagesveltecreateContent[c.name] =
            Build_Page_Svelte_Create_Content(
                c,
                templateContent,
                model.associations
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
            filePath + "/+page.server.ts",
            typespluspagetseditContent[c.name],
            "utf8"
        );
        fs.writeFileSync(
            filePath + "/+page.svelte",
            typespluspagesvelteeditContent[c.name],
            "utf8"
        );
        filePath = outputRoot + "/routes/" + c.name.toLowerCase() + "/create";
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(
            filePath + "/+page.server.ts",
            typespluspagetscreateContent[c.name],
            "utf8"
        );
        fs.writeFileSync(
            filePath + "/+page.svelte",
            typespluspagesveltecreateContent[c.name],
            "utf8"
        );
    }
}
