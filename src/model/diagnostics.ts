import type { CanonicalModel, ModelClass } from "./canonical-model";

export type Diagnostic = {
    severity: "error" | "warning";
    code: string;
    message: string;
    path?: string;
};

const findInheritanceCycles = (
    model: CanonicalModel,
    classesById: ReadonlyMap<string, ModelClass>,
): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    const completelyVisited = new Set<string>();
    const reportedCycles = new Set<string>();

    for (const modelClass of model.classes) {
        if (completelyVisited.has(modelClass.id)) {
            continue;
        }

        const currentPath: string[] = [];
        const positionInPath = new Map<string, number>();
        let current: ModelClass | undefined = modelClass;

        while (current) {
            const cycleStart = positionInPath.get(current.id);

            if (cycleStart !== undefined) {
                const cycle = [...currentPath.slice(cycleStart), current.id];

                // Normalize the key so the same cycle is only reported once.
                const cycleMembers = cycle.slice(0, -1).sort();
                const cycleKey = cycleMembers.join("|");

                if (!reportedCycles.has(cycleKey)) {
                    reportedCycles.add(cycleKey);

                    diagnostics.push({
                        severity: "error",
                        code: "inheritance-cycle",
                        message: `Inheritance cycle detected: ${cycle.join(
                            " -> ",
                        )}.`,
                        path: `classes.${modelClass.id}.parentId`,
                    });
                }

                break;
            }

            if (completelyVisited.has(current.id)) {
                break;
            }

            positionInPath.set(current.id, currentPath.length);
            currentPath.push(current.id);

            current = current.parentId
                ? classesById.get(current.parentId)
                : undefined;
        }

        for (const classId of currentPath) {
            completelyVisited.add(classId);
        }
    }

    return diagnostics;
};

export const validateModel = (model: CanonicalModel): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    const classesById = new Map<string, ModelClass>();

    for (const modelClass of model.classes) {
        if (classesById.has(modelClass.id)) {
            diagnostics.push({
                severity: "error",
                code: "duplicate-class-id",
                message: `Class ID '${modelClass.id}' is duplicated.`,
                path: `classes.${modelClass.id}`,
            });
        }

        classesById.set(modelClass.id, modelClass);
    }

    for (const modelClass of model.classes) {
        if (
            modelClass.parentId !== undefined &&
            !classesById.has(modelClass.parentId)
        ) {
            diagnostics.push({
                severity: "error",
                code: "unknown-parent",
                message:
                    `Class '${modelClass.id}' references unknown parent ` +
                    `'${modelClass.parentId}'.`,
                path: `classes.${modelClass.id}.parentId`,
            });
        }
    }

    for (const association of model.associations) {
        for (const [endpointName, endpoint] of [
            ["source", association.source],
            ["target", association.target],
        ] as const) {
            if (!classesById.has(endpoint.classId)) {
                diagnostics.push({
                    severity: "error",
                    code: "unknown-association-class",
                    message:
                        `Association '${association.id}' references unknown ` +
                        `class '${endpoint.classId}'.`,
                    path:
                        `associations.${association.id}.` +
                        `${endpointName}.classId`,
                });
            }
        }
    }

    diagnostics.push(...findInheritanceCycles(model, classesById));

    return diagnostics;
};
