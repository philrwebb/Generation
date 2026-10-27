import { describe, expect, it } from "@jest/globals";
import type { CanonicalModel } from "../model/canonical-model";
import {
    getAncestors, getAssociationTargetClass, getClass, getParent,
    getCollectionAssociations, getEffectiveAttributes, getReferenceAssociations,
} from "../model/queries";
import { resolveModel } from "../model/resolve-model";

const document: CanonicalModel = {
    format: "generation-model", version: 1, name: "queries",
    classes: [
        { id: "core.base", name: "Base", namespace: "core", abstract: true, inheritanceStrategy: "none", attributes: [{ name: "id", type: { kind: "integer" }, visibility: "public", nullable: false }] },
        { id: "people.person", name: "Person", namespace: "people", abstract: false, inheritanceStrategy: "none", parentId: "core.base", attributes: [{ name: "name", type: { kind: "string" }, visibility: "public", nullable: false }] },
        { id: "people.address", name: "Address", namespace: "people", abstract: false, inheritanceStrategy: "none", attributes: [] },
        { id: "reference.gender", name: "Gender", namespace: "reference", abstract: false, inheritanceStrategy: "none", attributes: [] },
    ],
    associations: [
        { id: "addresses", source: { classId: "people.person", cardinality: { minimum: 0, maximum: 1 }, navigable: false }, target: { classId: "people.address", role: "addresses", cardinality: { minimum: 0, maximum: "*" }, navigable: true } },
        { id: "gender", source: { classId: "people.person", cardinality: { minimum: 0, maximum: "*" }, navigable: false }, target: { classId: "reference.gender", role: "gender", cardinality: { minimum: 1, maximum: 1 }, navigable: true } },
    ],
};

describe("resolved model queries", () => {
    const model = resolveModel(document);
    const person = model.classesById.get("people.person")!;
    it("looks up classes by ID and reports unknown IDs", () => {
        expect(getClass(model, person.id)).toBe(person);
        expect(() => getClass(model, "missing")).toThrow("Unknown class 'missing'.");
    });

    it("resolves parents and returns undefined for root classes", () => {
        const base = getClass(model, "core.base");
        expect(getParent(model, person)).toBe(base);
        expect(getParent(model, base)).toBeUndefined();
        expect(() => getParent(model, { ...person, parentId: "missing" }))
            .toThrow("Unknown class 'missing'.");
    });

    it("resolves association targets and reports missing target classes", () => {
        const association = document.associations[0];
        expect(getAssociationTargetClass(model, association)).toBe(getClass(model, "people.address"));
        expect(() => getAssociationTargetClass(model, {
            ...association, target: { ...association.target, classId: "missing" },
        })).toThrow("Unknown class 'missing'.");
    });

    it("returns ancestors in root-to-parent order for multiple generations", () => {
        const child = { ...person, id: "people.child", parentId: person.id };
        const extended = resolveModel({ ...document, classes: [...document.classes, child] });
        expect(getAncestors(extended, child)).toEqual([getClass(model, "core.base"), person]);
        expect(getAncestors(model, getClass(model, "core.base"))).toEqual([]);
        expect(getEffectiveAttributes(extended, child).map(({ name }) => name)).toEqual(["id", "name", "name"]);
    });

    it.each([true, false])("rejects inheritance cycles (self-reference: %s)", (selfReference) => {
        const first = { ...person, id: "first", parentId: selfReference ? "first" : "second" };
        const second = { ...person, id: "second", parentId: "first" };
        const cyclic = resolveModel({ ...document, classes: [first, second], associations: [] });
        expect(() => getAncestors(cyclic, first)).toThrow("Inheritance cycle encountered at 'first'.");
    });

    it("reports missing ancestors instead of returning a partial chain", () => {
        expect(() => getAncestors(model, { ...person, parentId: "missing" }))
            .toThrow("Unknown class 'missing'.");
    });

    it("returns no navigations for classes without associations or with only incoming associations", () => {
        for (const id of ["core.base", "people.address", "reference.gender"]) {
            const modelClass = getClass(model, id);
            expect(getCollectionAssociations(model, modelClass)).toEqual([]);
            expect(getReferenceAssociations(model, modelClass)).toEqual([]);
        }
    });

    it("filters by target navigability even when the source is navigable", () => {
        const hidden = document.associations.map((association) => ({
            ...association,
            source: { ...association.source, navigable: true },
            target: { ...association.target, navigable: false },
        }));
        const resolved = resolveModel({ ...document, associations: [...document.associations, ...hidden] });
        expect(getCollectionAssociations(resolved, person)).toEqual([document.associations[0]]);
        expect(getReferenceAssociations(resolved, person)).toEqual([document.associations[1]]);
    });
    it("returns inherited attributes in base-to-child order", () => {
        expect(getEffectiveAttributes(model, person).map((item) => item.name)).toEqual(["id", "name"]);
    });
    it("classifies outgoing navigations by target cardinality", () => {
        expect(getCollectionAssociations(model, person).map((item) => item.id)).toEqual(["addresses"]);
        expect(getReferenceAssociations(model, person).map((item) => item.id)).toEqual(["gender"]);
    });
});
