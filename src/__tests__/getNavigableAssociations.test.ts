import {
    getNavigableAssociationsForClass,
    Class,
    Model,
    Association,
    Endpoint,
} from "../genmodel";

describe("getNavigableAssociationsForClass", () => {
    it("returns navigable associations for a class including those from its parent recursively", () => {
        // Dummy parent class
        const parent: Class = {
            name: "Parent",
            attributes: [],
            isAbstract: false,
            // undefined parent indicates top-level
        };

        // Dummy child class with a non-empty parent
        const child: Class = {
            name: "Child",
            attributes: [],
            isAbstract: false,
            parent: parent,
        };

        // Define endpoints for associations
        const parentEndpoint: Endpoint = {
            multiplicity: "1",
            role: "",
            class: parent,
            navagability: true,
        };

        const childEndpoint: Endpoint = {
            multiplicity: "1",
            role: "",
            class: child,
            navagability: true,
        };

        // A non-navigable endpoint (should be filtered out)
        const nonNavEndpoint: Endpoint = {
            multiplicity: "1",
            role: "",
            class: parent,
            navagability: false,
        };

        // Define associations:
        // Navigable association from the parent
        const assocFromParent: Association = {
            name: "assocFromParent",
            source: parentEndpoint,
            target: { ...parentEndpoint, class: child },
        };

        // Non-navigable association from the parent (should be filtered)
        const nonNavAssoc: Association = {
            name: "nonNavAssoc",
            source: nonNavEndpoint,
            target: { ...nonNavEndpoint, class: child },
        };

        // Navigable association from the child
        const assocFromChild: Association = {
            name: "assocFromChild",
            source: childEndpoint,
            target: { ...childEndpoint, class: parent },
        };

        const model: Model = {
            modeldate: new Date(),
            classes: [parent, child],
            associations: [assocFromParent, nonNavAssoc, assocFromChild],
        };

        // Execute the function for the child class
        const results = getNavigableAssociationsForClass(
            child,
            model.associations
        );
        // Expect associations from parent (assocFromParent) and child's own (assocFromChild)
        expect(results).toHaveLength(2);
        expect(results).toEqual(
            expect.arrayContaining([assocFromParent, assocFromChild])
        );
    });
});
