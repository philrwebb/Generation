import { describe, expect, it } from "@jest/globals";
import type { CanonicalModel } from "../model/canonical-model";
import { getCollectionAssociations, getEffectiveAttributes, getReferenceAssociations } from "../model/queries";
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
    it("returns inherited attributes in base-to-child order", () => {
        expect(getEffectiveAttributes(model, person).map((item) => item.name)).toEqual(["id", "name"]);
    });
    it("classifies outgoing navigations by target cardinality", () => {
        expect(getCollectionAssociations(model, person).map((item) => item.id)).toEqual(["addresses"]);
        expect(getReferenceAssociations(model, person).map((item) => item.id)).toEqual(["gender"]);
    });
});
