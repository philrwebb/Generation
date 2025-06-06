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
            navigability: true,
        };

        const childEndpoint: Endpoint = {
            multiplicity: "1",
            role: "",
            class: child,
            navigability: true,
        };

        // A non-navigable endpoint (should be filtered out)
        const nonNavEndpoint: Endpoint = {
            multiplicity: "1",
            role: "",
            class: parent,
            navigability: false,
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

    it("returns a navigable association when the source endpoint has a role and is navigable", () => {
        const classA: Class = {
            name: "ClassA",
            attributes: [],
            isAbstract: false,
        };
        const classB: Class = {
            name: "ClassB",
            attributes: [],
            isAbstract: false,
        };

        const navigableEndpointWithRole: Endpoint = {
            multiplicity: "1",
            role: "roleForA", // Non-empty role
            class: classA,
            navigability: true,
        };

        const targetEndpoint: Endpoint = {
            multiplicity: "*",
            role: "roleForB",
            class: classB,
            navigability: true,
        };

        const associationWithRole: Association = {
            name: "assocWithRole",
            source: navigableEndpointWithRole,
            target: targetEndpoint,
        };

        // Another association where ClassA is the target, to ensure it's not picked up
        const associationWhereAisTarget: Association = {
            name: "assocWhereAisTarget",
            source: targetEndpoint, // ClassB is source
            target: navigableEndpointWithRole, // ClassA is target
        };

        const model: Model = {
            modeldate: new Date(),
            classes: [classA, classB],
            associations: [associationWithRole, associationWhereAisTarget],
        };

        const results = getNavigableAssociationsForClass(
            classA,
            model.associations
        );

        expect(results).toHaveLength(1);
        expect(results).toContain(associationWithRole);
        expect(results).not.toContain(associationWhereAisTarget);
    });
});
