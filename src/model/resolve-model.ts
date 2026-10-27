import {
    CanonicalModel,
    ModelAssociation,
    ModelClass,
} from "./canonical-model";

export type ResolvedModel = {
    document: CanonicalModel;
    classesById: ReadonlyMap<string, ModelClass>;
    associationsByClassId: ReadonlyMap<string, readonly ModelAssociation[]>;
};

export function resolveModel(document: CanonicalModel): ResolvedModel {
    const classesById = new Map(
        document.classes.map((modelClass) => [modelClass.id, modelClass]),
    );

    const associationsByClassId = new Map<string, ModelAssociation[]>();

    for (const association of document.associations) {
        for (const classId of [
            association.source.classId,
            association.target.classId,
        ]) {
            const associations = associationsByClassId.get(classId) ?? [];
            associations.push(association);
            associationsByClassId.set(classId, associations);
        }
    }

    return {
        document,
        classesById,
        associationsByClassId,
    };
}
