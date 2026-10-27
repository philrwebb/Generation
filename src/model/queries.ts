import type { ModelAssociation, ModelAttribute, ModelClass } from "./canonical-model";
import type { ResolvedModel } from "./resolve-model";

export const getClass = (model: ResolvedModel, classId: string): ModelClass => {
    const modelClass = model.classesById.get(classId);
    if (!modelClass) throw new Error(`Unknown class '${classId}'.`);
    return modelClass;
};

export const getParent = (model: ResolvedModel, modelClass: ModelClass): ModelClass | undefined =>
    modelClass.parentId ? getClass(model, modelClass.parentId) : undefined;

export const getAncestors = (model: ResolvedModel, modelClass: ModelClass): ModelClass[] => {
    const ancestors: ModelClass[] = [];
    const visited = new Set([modelClass.id]);
    let current = modelClass;
    while (current.parentId) {
        if (visited.has(current.parentId)) throw new Error(`Inheritance cycle encountered at '${current.parentId}'.`);
        visited.add(current.parentId);
        current = getClass(model, current.parentId);
        ancestors.unshift(current);
    }
    return ancestors;
};

export const getEffectiveAttributes = (model: ResolvedModel, modelClass: ModelClass): ModelAttribute[] => [
    ...getAncestors(model, modelClass).flatMap((ancestor) => ancestor.attributes),
    ...modelClass.attributes,
];

const getOutgoingNavigableAssociations = (model: ResolvedModel, modelClass: ModelClass): ModelAssociation[] =>
    (model.associationsByClassId.get(modelClass.id) ?? []).filter(
        (association) => association.source.classId === modelClass.id && association.target.navigable,
    );

export const getReferenceAssociations = (model: ResolvedModel, modelClass: ModelClass): ModelAssociation[] =>
    getOutgoingNavigableAssociations(model, modelClass).filter(
        (association) => association.target.cardinality.maximum === 1,
    );

export const getCollectionAssociations = (model: ResolvedModel, modelClass: ModelClass): ModelAssociation[] =>
    getOutgoingNavigableAssociations(model, modelClass).filter(
        (association) => association.target.cardinality.maximum === "*",
    );

export const getAssociationTargetClass = (model: ResolvedModel, association: ModelAssociation): ModelClass =>
    getClass(model, association.target.classId);
