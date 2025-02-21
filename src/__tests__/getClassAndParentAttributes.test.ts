import { getClassAndParentAttributes, Class, Visibility } from "../genmodel";

describe("getClassAndParentAttributes", () => {
    it("should return only child attributes when no parent exists", () => {
        const child: Class = {
            name: "Child",
            parent: {} as Class,
            attributes: [
                {
                    name: "childAttr",
                    type: "string",
                    visibility: Visibility.Public,
                },
            ],
            isAbstract: true,
        };
        const result = getClassAndParentAttributes(child);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("childAttr");
    });

    it("should return parent's and child's attributes when parent exists", () => {
        const parent: Class = {
            name: "Parent",
            parent: {} as Class,
            attributes: [
                {
                    name: "parentAttr",
                    type: "int",
                    visibility: Visibility.Public,
                },
            ],
            isAbstract: false,
        };
        const child: Class = {
            name: "Child",
            parent: parent,
            attributes: [
                {
                    name: "childAttr",
                    type: "string",
                    visibility: Visibility.Public,
                },
            ],
            isAbstract: false,
        };
        const result = getClassAndParentAttributes(child);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("parentAttr");
        expect(result[1].name).toBe("childAttr");
    });
});
