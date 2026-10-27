import {
    MODEL_FORMAT,
    MODEL_VERSION,
    type Cardinality,
    type CanonicalModel,
    type InheritanceStrategy,
    type ModelAssociation,
    type ModelAttribute,
    type ModelClass,
    type ModelType,
    type Visibility,
} from "../../model/canonical-model";
import { validateModel } from "../../model/diagnostics";

type ClassMetadata = {
    inheritanceStrategy: InheritanceStrategy;
    namespace: string;
};

const toKebabCase = (value: string): string =>
    value
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

const classId = (namespace: string, name: string): string =>
    `${toKebabCase(namespace)}.${toKebabCase(name)}`;

const parseModelName = (lines: string[]): string => {
    const firstDelimiter = lines.findIndex((line) => line.trim() === "---");
    if (firstDelimiter >= 0) {
        const secondDelimiter = lines.findIndex(
            (line, index) => index > firstDelimiter && line.trim() === "---",
        );
        if (secondDelimiter > firstDelimiter + 1) {
            return lines
                .slice(firstDelimiter + 1, secondDelimiter)
                .map((line) => line.trim())
                .filter(Boolean)
                .join(" ");
        }
    }
    return "Unnamed Model";
};

const parseMetadata = (line: string): [string, ClassMetadata] | undefined => {
    const match = line.match(/^note\s+for\s+(\w+)\s+"([^"]+)"\s*$/);
    if (!match) return undefined;

    const values = new Map(
        match[2].split(",").map((part) => {
            const [key, value] = part.split("=", 2).map((item) => item.trim());
            return [key, value];
        }),
    );
    const namespace = values.get("namespace");
    if (!namespace) {
        throw new Error(`Class '${match[1]}' has no namespace in its note.`);
    }

    const rawInheritance = values.get("inheritance") ?? "none";
    const inheritanceStrategies: Record<string, InheritanceStrategy> = {
        none: "none",
        rollup: "rollup",
        propagateattributes: "propagateAttributes",
        propagateAttributes: "propagateAttributes",
    };
    const inheritanceStrategy = inheritanceStrategies[rawInheritance];
    if (!inheritanceStrategy) {
        throw new Error(
            `Class '${match[1]}' has unsupported inheritance strategy '${rawInheritance}'.`,
        );
    }

    return [match[1], { namespace, inheritanceStrategy }];
};

const parseType = (
    rawType: string,
    length?: string,
    scale?: string,
): ModelType => {
    switch (rawType.toLowerCase()) {
        case "string":
            return length
                ? { kind: "string", maxLength: Number(length) }
                : { kind: "string" };
        case "int":
        case "integer":
            return { kind: "integer" };
        case "decimal":
            return {
                kind: "decimal",
                ...(length ? { precision: Number(length) } : {}),
                ...(scale ? { scale: Number(scale) } : {}),
            };
        case "bool":
        case "boolean":
            return { kind: "boolean" };
        case "date":
            return { kind: "date" };
        case "datetime":
            return { kind: "dateTime" };
        default:
            throw new Error(`Unsupported model type '${rawType}'.`);
    }
};

const parseAttribute = (line: string, className: string): ModelAttribute => {
    // The optional colon without a number accepts the existing `+date: startDate`.
    const match = line.match(
        /^([+\-#])([a-zA-Z]+)(?::(?:(\d+)(?:,(\d+))?)?)?\s+([a-zA-Z_][a-zA-Z0-9_]*)$/,
    );
    if (!match) {
        throw new Error(`Could not parse attribute in '${className}': ${line}`);
    }

    const visibility: Record<string, Visibility> = {
        "+": "public",
        "-": "private",
        "#": "protected",
    };
    return {
        name: match[5],
        type: parseType(match[2], match[3], match[4]),
        visibility: visibility[match[1]],
        nullable: false,
    };
};

const parseCardinality = (value: string): Cardinality => {
    switch (value) {
        case "0":
        case "0..1":
            return { minimum: 0, maximum: 1 };
        case "1":
            return { minimum: 1, maximum: 1 };
        case "*":
        case "0..*":
            return { minimum: 0, maximum: "*" };
        case "1..*":
            return { minimum: 1, maximum: "*" };
        default:
            throw new Error(`Unsupported Mermaid multiplicity '${value}'.`);
    }
};

export const parseMermaidModel = (source: string): CanonicalModel => {
    const lines = source.split(/\r?\n/);
    const metadataByClassName = new Map<string, ClassMetadata>();
    const classes: ModelClass[] = [];
    const classesByName = new Map<string, ModelClass>();

    for (const rawLine of lines) {
        const metadata = parseMetadata(rawLine.trim());
        if (metadata) metadataByClassName.set(...metadata);
    }

    // First pass: classes and attributes. Relationships may refer to later classes.
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trim();
        const classMatch = line.match(/^class\s+(\w+)\s*\{$/);
        if (!classMatch) continue;

        const name = classMatch[1];
        const metadata = metadataByClassName.get(name);
        if (!metadata) {
            throw new Error(`Class '${name}' has no preceding Mermaid note.`);
        }
        if (classesByName.has(name)) {
            throw new Error(`Class name '${name}' is duplicated.`);
        }

        const attributes: ModelAttribute[] = [];
        for (index += 1; index < lines.length; index++) {
            const attributeLine = lines[index].trim();
            if (attributeLine === "}") break;
            if (attributeLine) attributes.push(parseAttribute(attributeLine, name));
        }
        const modelClass: ModelClass = {
            id: classId(metadata.namespace, name),
            name,
            namespace: metadata.namespace,
            abstract: false,
            inheritanceStrategy: metadata.inheritanceStrategy,
            attributes,
        };
        classes.push(modelClass);
        classesByName.set(name, modelClass);
    }

    const associations: ModelAssociation[] = [];
    const associationIds = new Set<string>();

    // Second pass: stereotypes, inheritance and associations.
    for (const rawLine of lines) {
        const line = rawLine
            .trim()
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
        const abstractMatch = line.match(/^<<Abstract>>\s+(\w+)$/i);
        if (abstractMatch) {
            const modelClass = classesByName.get(abstractMatch[1]);
            if (!modelClass) throw new Error(`Unknown abstract class '${abstractMatch[1]}'.`);
            modelClass.abstract = true;
            continue;
        }

        const inheritanceMatch = line.match(/^(\w+)\s+(<\|--|--\|>)\s+(\w+)$/);
        if (inheritanceMatch) {
            const parentName = inheritanceMatch[2] === "<|--" ? inheritanceMatch[1] : inheritanceMatch[3];
            const childName = inheritanceMatch[2] === "<|--" ? inheritanceMatch[3] : inheritanceMatch[1];
            const parent = classesByName.get(parentName);
            const child = classesByName.get(childName);
            if (!parent || !child) throw new Error(`Unknown class in inheritance: ${line}`);
            child.parentId = parent.id;
            continue;
        }

        const associationMatch = line.match(
            /^(\w+)\s+"([*\d.]+)"\s+-->\s+"([*\d.]+)"\s+(\w+)(?:\s*:\s*(\w+))?\s*$/,
        );
        if (!associationMatch) continue;

        const sourceClass = classesByName.get(associationMatch[1]);
        const targetClass = classesByName.get(associationMatch[4]);
        if (!sourceClass || !targetClass) throw new Error(`Unknown class in association: ${line}`);
        const role = associationMatch[5] ?? targetClass.name.toLowerCase();
        const baseId = `${sourceClass.id}--${toKebabCase(role)}--${targetClass.id}`;
        let id = baseId;
        let suffix = 2;
        while (associationIds.has(id)) id = `${baseId}-${suffix++}`;
        associationIds.add(id);

        associations.push({
            id,
            source: {
                classId: sourceClass.id,
                cardinality: parseCardinality(associationMatch[2]),
                navigable: false,
            },
            target: {
                classId: targetClass.id,
                role,
                cardinality: parseCardinality(associationMatch[3]),
                navigable: true,
            },
        });
    }

    const model: CanonicalModel = {
        format: MODEL_FORMAT,
        version: MODEL_VERSION,
        name: parseModelName(lines),
        classes,
        associations,
    };
    const errors = validateModel(model).filter((item) => item.severity === "error");
    if (errors.length) {
        throw new Error(errors.map((item) => `[${item.code}] ${item.message}`).join("\n"));
    }
    return model;
};
