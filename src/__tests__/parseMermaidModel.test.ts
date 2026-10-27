import { describe, expect, it } from "@jest/globals";
import { parseMermaidModel } from "../inputs/mermaid/parse-mermaid-model";

const classBlock = (name = "Item", attributes = "", metadata = "namespace=core") =>
    `note for ${name} "${metadata}"\nclass ${name} {\n${attributes}\n}`;

describe("parseMermaidModel", () => {
    it.each(["", "---\n---", "---\nUnclosed title"])("uses the default name without a complete title (%j)", (source) => {
        expect(parseMermaidModel(source)).toEqual({
            format: "generation-model", version: 1, name: "Unnamed Model", classes: [], associations: [],
        });
    });

    it("joins nonempty title lines and handles CRLF input", () => {
        expect(parseMermaidModel("---\r\n First \r\n\r\n Second \r\n---").name).toBe("First Second");
    });

    it.each([
        ["+string label", { kind: "string" }, "public", "label"],
        ["-integer count", { kind: "integer" }, "private", "count"],
        ["#decimal:12,2 amount", { kind: "decimal", precision: 12, scale: 2 }, "protected", "amount"],
        ["+decimal:8 amount", { kind: "decimal", precision: 8 }, "public", "amount"],
        ["+decimal amount", { kind: "decimal" }, "public", "amount"],
        ["+bool enabled", { kind: "boolean" }, "public", "enabled"],
        ["+boolean enabled", { kind: "boolean" }, "public", "enabled"],
        ["+date: startDate", { kind: "date" }, "public", "startDate"],
        ["+DATETIME createdAt", { kind: "dateTime" }, "public", "createdAt"],
    ])("parses attribute %s", (line, type, visibility, name) => {
        expect(parseMermaidModel(classBlock("Item", line)).classes[0].attributes).toEqual([
            { name, type, visibility, nullable: false },
        ]);
    });

    it.each(["none", "rollup", "propagateattributes", "propagateAttributes"])(
        "supports inheritance metadata %s", (strategy) => {
            const result = parseMermaidModel(classBlock("OrderItem", "", ` namespace = Sales.Core , inheritance = ${strategy} `));
            expect(result.classes[0]).toMatchObject({
                id: "sales-core.order-item", namespace: "Sales.Core", abstract: false,
                inheritanceStrategy: strategy === "propagateattributes" ? "propagateAttributes" : strategy,
            });
        },
    );

    it("defaults inheritance strategy and trims punctuation from generated IDs", () => {
        expect(parseMermaidModel(classBlock("Item", "", "namespace=-Core-")).classes[0])
            .toMatchObject({ id: "core.item", inheritanceStrategy: "none", attributes: [] });
    });

    it.each([
        ["0", { minimum: 0, maximum: 1 }],
        ["0..1", { minimum: 0, maximum: 1 }],
        ["1", { minimum: 1, maximum: 1 }],
        ["*", { minimum: 0, maximum: "*" }],
        ["0..*", { minimum: 0, maximum: "*" }],
        ["1..*", { minimum: 1, maximum: "*" }],
    ])("parses cardinality %s on both endpoints", (multiplicity, cardinality) => {
        const result = parseMermaidModel(`${classBlock()}\nItem "${multiplicity}" --> "${multiplicity}" Item`);
        expect(result.associations[0]).toEqual({
            id: "core.item--item--core.item",
            source: { classId: "core.item", cardinality, navigable: false },
            target: { classId: "core.item", cardinality, role: "item", navigable: true },
        });
    });

    it("assigns unique IDs to repeated associations and normalizes explicit roles", () => {
        const link = 'Item "1" --> "*" Item : relatedItems';
        const result = parseMermaidModel(`${classBlock()}\n${link}\n${link}\n${link}`);
        expect(result.associations.map(({ id }) => id)).toEqual([
            "core.item--related-items--core.item", "core.item--related-items--core.item-2",
            "core.item--related-items--core.item-3",
        ]);
        expect(result.associations.map(({ target }) => target.role)).toEqual(Array(3).fill("relatedItems"));
    });

    it.each(["Child --|> Base", "Base &lt;|-- Child", "Child --|&gt; Base"])(
        "supports inheritance syntax %s and forward class references", (relationship) => {
            const result = parseMermaidModel(`${relationship}\n&lt;&lt;abstract&gt;&gt; Base\n${classBlock("Child")}\n${classBlock("Base")}`);
            expect(result.classes[0].parentId).toBe("core.base");
            expect(result.classes[1].abstract).toBe(true);
        },
    );

    it.each([
        ['note for Item "inheritance=none"', "Class 'Item' has no namespace in its note."],
        ['note for Item "namespace=core,inheritance=invalid"', "Class 'Item' has unsupported inheritance strategy 'invalid'."],
        ["class Item {\n}", "Class 'Item' has no preceding Mermaid note."],
        [`${classBlock()}\n${classBlock()}`, "Class name 'Item' is duplicated."],
        [classBlock("Item", "string missingVisibility"), "Could not parse attribute in 'Item': string missingVisibility"],
        [classBlock("Item", "+uuid id"), "Unsupported model type 'uuid'."],
        ["<<Abstract>> Missing", "Unknown abstract class 'Missing'."],
        [`${classBlock()}\nMissing <|-- Item`, "Unknown class in inheritance: Missing <|-- Item"],
        [`${classBlock()}\nItem <|-- Missing`, "Unknown class in inheritance: Item <|-- Missing"],
        [`${classBlock()}\nMissing "1" --> "*" Item`, 'Unknown class in association: Missing "1" --> "*" Item'],
        [`${classBlock()}\nItem "1" --> "*" Missing`, 'Unknown class in association: Item "1" --> "*" Missing'],
        [`${classBlock()}\nItem "2" --> "*" Item`, "Unsupported Mermaid multiplicity '2'."],
        [`${classBlock()}\nItem "1" --> "2" Item`, "Unsupported Mermaid multiplicity '2'."],
    ])("rejects invalid input %#", (source, message) => {
        expect(() => parseMermaidModel(source)).toThrow(message);
    });

    it("surfaces model validation diagnostics for inheritance cycles", () => {
        expect(() => parseMermaidModel(`${classBlock()}\nItem <|-- Item`))
            .toThrow("[inheritance-cycle] Inheritance cycle detected: core.item -> core.item.");
    });

    it("combines multiple validation diagnostics into one error", () => {
        const source = `${classBlock("First")}\n${classBlock("Second")}\nFirst <|-- First\nSecond <|-- Second`;
        expect(() => parseMermaidModel(source)).toThrow(
            "[inheritance-cycle] Inheritance cycle detected: core.first -> core.first.\n" +
            "[inheritance-cycle] Inheritance cycle detected: core.second -> core.second.",
        );
    });

    it("creates canonical classes, inheritance and associations", () => {
        const model = parseMermaidModel(`---
Test Model
---
classDiagram
note for Base "inheritance=propagateattributes,namespace=core"
class Base {
  +int id
}
<<Abstract>> Base
note for Person "inheritance=none,namespace=people"
class Person {
  +string:100 name
}
Base <|-- Person
Person "0" --> "*" Person : reports
`);

        expect(model.name).toBe("Test Model");
        expect(model.classes).toEqual([
            expect.objectContaining({ id: "core.base", abstract: true }),
            expect.objectContaining({
                id: "people.person",
                parentId: "core.base",
            }),
        ]);
        expect(model.classes[1].attributes[0].type).toEqual({
            kind: "string",
            maxLength: 100,
        });
        expect(model.associations[0]).toEqual(
            expect.objectContaining({
                id: "people.person--reports--people.person",
                source: expect.objectContaining({
                    classId: "people.person",
                }),
                target: expect.objectContaining({
                    classId: "people.person",
                    role: "reports",
                }),
            }),
        );
    });
});
