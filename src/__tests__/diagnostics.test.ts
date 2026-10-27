import type { CanonicalModel, ModelAssociation, ModelClass } from "../model/canonical-model";
import { validateModel } from "../model/diagnostics";

const modelClass = (id: string, parentId?: string): ModelClass => ({
    id, name: id, namespace: "test", abstract: false,
    inheritanceStrategy: "none", attributes: [], parentId,
});

const association = (id: string, sourceId: string, targetId: string): ModelAssociation => ({
    id,
    source: { classId: sourceId, cardinality: { minimum: 1, maximum: 1 }, navigable: false },
    target: { classId: targetId, cardinality: { minimum: 0, maximum: "*" }, navigable: true },
});

const model = (classes: ModelClass[] = [], associations: ModelAssociation[] = []): CanonicalModel => ({
    format: "generation-model", version: 1, name: "Diagnostics tests", classes, associations,
});

describe("validateModel", () => {
    it("accepts an empty model", () => {
        expect(validateModel(model())).toEqual([]);
    });

    it("accepts forward parent references, shared ancestors, and valid associations", () => {
        const document = model([
            modelClass("child", "parent"), modelClass("sibling", "parent"),
            modelClass("parent", "base"), modelClass("base"), modelClass("unrelated"),
        ], [association("children", "parent", "child"), association("self", "base", "base")]);
        const original = JSON.parse(JSON.stringify(document));
        expect(validateModel(document)).toEqual([]);
        // Validation must not alter the model that generators subsequently consume.
        expect(JSON.parse(JSON.stringify(document))).toEqual(original);
    });

    it("reports every repeated class ID even when the definitions differ", () => {
        expect(validateModel(model([
            modelClass("duplicate"), { ...modelClass("duplicate"), name: "Different name" },
            modelClass("duplicate"),
        ]))).toEqual(Array(2).fill({
            severity: "error", code: "duplicate-class-id",
            message: "Class ID 'duplicate' is duplicated.", path: "classes.duplicate",
        }));
    });

    it.each(["missing", ""])("reports an unknown parent %j without treating it as a cycle", (parentId) => {
        expect(validateModel(model([modelClass("child", parentId)]))).toEqual([{
            severity: "error", code: "unknown-parent",
            message: `Class 'child' references unknown parent '${parentId}'.`,
            path: "classes.child.parentId",
        }]);
    });

    it.each(["source", "target"] as const)("identifies an unknown association %s class", (endpoint) => {
        const link = association("link", "known", "known");
        link[endpoint].classId = "missing";
        expect(validateModel(model([modelClass("known")], [link]))).toEqual([{
            severity: "error", code: "unknown-association-class",
            message: "Association 'link' references unknown class 'missing'.",
            path: `associations.link.${endpoint}.classId`,
        }]);
    });

    it("reports both missing endpoints even when they refer to the same class", () => {
        expect(validateModel(model([], [association("broken", "missing", "missing")]))).toEqual(
            ["source", "target"].map((endpoint) => ({
                severity: "error", code: "unknown-association-class",
                message: "Association 'broken' references unknown class 'missing'.",
                path: `associations.broken.${endpoint}.classId`,
            })),
        );
    });

    it("reports self inheritance", () => {
        expect(validateModel(model([modelClass("self", "self")]))).toEqual([{
            severity: "error", code: "inheritance-cycle",
            message: "Inheritance cycle detected: self -> self.", path: "classes.self.parentId",
        }]);
    });

    it("reports a shared cycle once and omits the leading non-cyclic classes from its message", () => {
        expect(validateModel(model([
            modelClass("entry", "a"), modelClass("a", "b"), modelClass("b", "c"),
            modelClass("c", "a"), modelClass("anotherEntry", "b"),
        ]))).toEqual([{
            severity: "error", code: "inheritance-cycle",
            message: "Inheritance cycle detected: a -> b -> c -> a.",
            path: "classes.entry.parentId",
        }]);
    });

    it("reports separate cycles independently", () => {
        const result = validateModel(model([
            modelClass("a", "b"), modelClass("b", "a"), modelClass("c", "c"),
        ]));
        expect(result).toEqual([
            { severity: "error", code: "inheritance-cycle",
                message: "Inheritance cycle detected: a -> b -> a.", path: "classes.a.parentId" },
            { severity: "error", code: "inheritance-cycle",
                message: "Inheritance cycle detected: c -> c.", path: "classes.c.parentId" },
        ]);
    });

    it("collects all error categories in one validation pass", () => {
        const document = model([
            modelClass("duplicate"), modelClass("duplicate"),
            modelClass("orphan", "missing"), modelClass("cycle", "cycle"),
        ], [association("broken", "missing", "orphan")]);
        expect(validateModel(document).map(({ code }) => code)).toEqual([
            "duplicate-class-id", "unknown-parent", "unknown-association-class", "inheritance-cycle",
        ]);
        // Revalidating must not retain traversal state from a previous call.
        expect(validateModel(document)).toEqual(validateModel(document));
    });
});
