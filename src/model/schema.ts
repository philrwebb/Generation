import { z } from "zod";

const modelTypeSchema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("string"),
        maxLength: z.number().int().positive().optional(),
    }),
    z.object({ kind: z.literal("integer") }),
    z.object({
        kind: z.literal("decimal"),
        precision: z.number().int().positive().optional(),
        scale: z.number().int().nonnegative().optional(),
    }),
    z.object({ kind: z.literal("boolean") }),
    z.object({ kind: z.literal("date") }),
    z.object({ kind: z.literal("dateTime") }),
]);

const attributeSchema = z.object({
    name: z.string().min(1),
    type: modelTypeSchema,
    visibility: z.enum(["public", "private", "protected"]),
    nullable: z.boolean(),
});

const endpointSchema = z.object({
    classId: z.string().min(1),
    role: z.string().min(1).optional(),
    cardinality: z.object({
        minimum: z.union([z.literal(0), z.literal(1)]),
        maximum: z.union([z.literal(1), z.literal("*")]),
    }),
    navigable: z.boolean(),
    ownsForeignKey: z.boolean().optional(),
});

export const canonicalModelSchema = z.object({
    format: z.literal("generation-model"),
    version: z.literal(1),
    name: z.string().min(1),
    classes: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            namespace: z.string().min(1),
            abstract: z.boolean(),
            inheritanceStrategy: z.enum([
                "none",
                "rollup",
                "propagateAttributes",
            ]),
            parentId: z.string().min(1).optional(),
            attributes: z.array(attributeSchema),
        }),
    ),
    associations: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1).optional(),
            source: endpointSchema,
            target: endpointSchema,
        }),
    ),
});

export type CanonicalModel = z.infer<typeof canonicalModelSchema>;
