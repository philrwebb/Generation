import fs from "fs";
import os from "os";
import path from "path";
import {
    Attribute, Association, Class, Endpoint, Model, Visibility,
    serializeClassesToJson, deserializeJsonToClasses, readFileLines, WriteFile,
    printModel, GetParentColumns, FindClass, ModelTypeToCodeType, pluralize,
    camelCaseToTitleCase, getCollectionAssociationsForClass,
    getRefDataAssociationsForClass, GetRefDataClasses,
    getClassAndParentAttributes, getNavigableAssociationsForClass,
} from "../genmodel";

const attribute = (name: string): Attribute => ({ name, type: "string", visibility: Visibility.Public });
const modelClass = (name: string, parent?: Class): Class => ({
    name, parent, attributes: [attribute(`${name}Value`)], isAbstract: false,
});
const model = (classes: Class[] = [], associations: Association[] = []): Model => ({
    modeldate: new Date("2026-01-01T00:00:00Z"), classes, associations,
});
const association = (
    source: Class, target: Class,
    sourceMultiplicity: Endpoint["multiplicity"] = "1",
    targetMultiplicity: Endpoint["multiplicity"] = "*",
): Association => ({
    source: { class: source, multiplicity: sourceMultiplicity, navigability: false },
    target: { class: target, multiplicity: targetMultiplicity, navigability: true },
});

describe("model file utilities", () => {
    let directory: string;
    beforeEach(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), "genmodel-test-")); });
    afterEach(() => { fs.rmSync(directory, { recursive: true, force: true }); });

    it.each(["model.json", "nested/models/model.json"])("serializes and reads %s", (relativePath) => {
        const filePath = path.join(directory, relativePath);
        const person = modelClass("Person");
        const data = model([person], [association(person, person)]);
        serializeClassesToJson(data, filePath);
        expect(fs.readFileSync(filePath, "utf8")).toBe(JSON.stringify(data, null, 2));
        expect(deserializeJsonToClasses(filePath)).toEqual({
            ...data, modeldate: data.modeldate.toISOString(),
        });
    });

    it("overwrites an existing file with UTF-8 content", () => {
        WriteFile(directory, "message.txt", "old content");
        WriteFile(directory, "message.txt", "Café 世界");
        expect(fs.readFileSync(path.join(directory, "message.txt"), "utf8")).toBe("Café 世界");
    });

    it.each([
        ["first\nsecond", ["first", "second"]],
        ["first\r\nsecond\r\n", ["first", "second", ""]],
        ["first\n\nthird", ["first", "", "third"]],
        ["", [""]],
    ])("reads lines from %j", (content, expected) => {
        const filePath = path.join(directory, "lines.txt");
        fs.writeFileSync(filePath, content);
        expect(readFileLines(filePath)).toEqual(expected);
    });

    it("reports malformed JSON and missing input files", () => {
        const filePath = path.join(directory, "invalid.json");
        fs.writeFileSync(filePath, "{invalid}");
        expect(() => deserializeJsonToClasses(filePath)).toThrow(SyntaxError);
        expect(() => deserializeJsonToClasses(path.join(directory, "missing.json"))).toThrow();
        expect(() => readFileLines(path.join(directory, "missing.txt"))).toThrow();
    });
});

describe("model inspection", () => {
    afterEach(() => jest.restoreAllMocks());

    it("prints classes, their attributes, and associations in model order", () => {
        const person = modelClass("Person");
        const link = association(person, person);
        const log = jest.spyOn(console, "log").mockImplementation(() => {});
        printModel(model([person], [link]));
        expect(log.mock.calls).toEqual([[person], [person.attributes[0]], [link]]);
    });

    it("prints nothing for an empty model", () => {
        const log = jest.spyOn(console, "log").mockImplementation(() => {});
        printModel(model());
        expect(log).not.toHaveBeenCalled();
    });

    it("finds a class by its exact name and returns undefined for missing classes", () => {
        const person = modelClass("Person");
        expect(FindClass("Person", [modelClass("Other"), person])).toBe(person);
        expect(FindClass("person", [person])).toBeUndefined();
        expect(FindClass("Person", [])).toBeUndefined();
    });

    it.each([GetParentColumns, getClassAndParentAttributes])("collects ancestors before children without mutating inputs (%#)", (collect) => {
        const base = modelClass("Base");
        const parent = modelClass("Parent", base);
        const child = modelClass("Child", parent);
        const seed = [attribute("seed")];
        expect(collect(child, seed)).toEqual([
            seed[0], ...base.attributes, ...parent.attributes, ...child.attributes,
        ]);
        expect(seed).toEqual([attribute("seed")]);
        expect(child.attributes).toEqual([attribute("ChildValue")]);
        expect(collect(modelClass("Root"))).toEqual([attribute("RootValue")]);
    });

    it("tolerates a legacy parent placeholder with no attributes", () => {
        const child = modelClass("Child", {} as Class);
        expect(GetParentColumns(child)).toEqual(child.attributes);
    });
});

describe("model type conversion", () => {
    const languages = ["python", "typescript", "csharp", "zod", "html"];
    it.each([
        ["string", ["str", "string", "string", "string", "text"]],
        ["int", ["int", "number", "int", "number", "text"]],
        ["bool", ["bool", "boolean", "bool", "boolean", "text"]],
        ["date", ["date", "Date", "DateTime", "date", "date"]],
        ["datetime", ["date", "Date", "DateTime", "date", "date"]],
    ])("maps %s for every supported language", (type, expected) => {
        expect(languages.map((language) => ModelTypeToCodeType(type, language))).toEqual(expected);
        expect(ModelTypeToCodeType(type, "unsupported")).toBe(type);
    });

    it("preserves custom model types", () => {
        expect(ModelTypeToCodeType("CustomerId", "typescript")).toBe("CustomerId");
    });
});

describe("name formatting", () => {
    it.each([
        ["man", "men"], ["woman", "women"], ["child", "children"],
        ["tooth", "teeth"], ["foot", "feet"], ["mouse", "mice"],
        ["goose", "geese"], ["Party", "Parties"], ["PERSON", "People"],
        ["bus", "buses"], ["box", "boxes"], ["buzz", "buzzes"],
        ["church", "churches"], ["city", "cities"], ["leaf", "leaves"],
        ["knife", "knives"], ["car", "cars"], ["day", "days"],
    ])("pluralizes %s as %s", (singular, plural) => {
        expect(pluralize(singular)).toBe(plural);
    });

    it.each([["firstName", "First Name"], ["name", "Name"], ["", ""]])(
        "converts %j to a title", (input, expected) => {
            expect(camelCaseToTitleCase(input)).toBe(expected);
        },
    );
});

describe("association queries", () => {
    const source = modelClass("Source");
    const target = modelClass("Target");

    it("selects only zero/one-to-many collections for the target class name", () => {
        const required = association(source, target);
        const optional = association(source, target, "0");
        const rejected = [
            association(source, target, "*"), association(source, target, "n"),
            association(source, target, "1", "1"), association(target, source),
        ];
        expect(getCollectionAssociationsForClass({ ...target }, model([], [required, optional, ...rejected])))
            .toEqual([required, optional]);
        expect(getCollectionAssociationsForClass(target, model())).toEqual([]);
    });

    it("selects only many-to-one references from the source class name", () => {
        const reference = association(source, target, "*", "1");
        const rejected = [
            association(source, target, "1", "1"), association(source, target, "*", "0"),
            association(target, source, "*", "1"),
        ];
        expect(getRefDataAssociationsForClass({ ...source }, [reference, ...rejected])).toEqual([reference]);
        expect(getRefDataAssociationsForClass(source, [])).toEqual([]);
    });

    it("returns only direct children of ReferenceBase", () => {
        const base = modelClass("ReferenceBase");
        const reference = modelClass("Status", base);
        const classes = [base, reference, modelClass("Other", source),
            modelClass("Placeholder", {} as Class), modelClass("Grandchild", reference)];
        expect(GetRefDataClasses(model(classes))).toEqual([reference]);
        expect(GetRefDataClasses(model())).toEqual([]);
    });

    it("orders inherited navigations before local ones and ignores source navigability", () => {
        const base = modelClass("Base", {} as Class);
        const parent = modelClass("Parent", base);
        const child = modelClass("Child", parent);
        const links = [association(child, target), association(parent, target), association(base, target)];
        const hidden = association(child, target);
        hidden.target.navigability = false;
        expect(getNavigableAssociationsForClass(child, [...links, hidden, association(target, child)]))
            .toEqual([links[2], links[1], links[0]]);
        expect(getNavigableAssociationsForClass(child, [])).toEqual([]);
    });
});
