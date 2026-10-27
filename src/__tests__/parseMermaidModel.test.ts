import { describe, expect, it } from "@jest/globals";
import { parseMermaidModel } from "../inputs/mermaid/parse-mermaid-model";

describe("parseMermaidModel", () => {
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
