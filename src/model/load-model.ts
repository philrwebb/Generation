import fs from "node:fs";
import { canonicalModelSchema } from "./schema";
import type { CanonicalModel } from "./canonical-model";
import { resolveModel } from "./resolve-model";
import type { ResolvedModel } from "./resolve-model";
import { validateModel } from "./diagnostics";

export function loadModel(filePath: string): ResolvedModel {
    const input: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const document = canonicalModelSchema.parse(input) as CanonicalModel;

    const diagnostics = validateModel(document);
    const errors = diagnostics.filter((item) => item.severity === "error");

    if (errors.length > 0) {
        throw new Error(
            errors
                .map((error) => `[${error.code}] ${error.message}`)
                .join("\n"),
        );
    }

    return resolveModel(document);
}
