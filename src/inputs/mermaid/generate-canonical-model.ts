import fs from "node:fs";
import path from "node:path";
import { canonicalModelSchema } from "../../model/schema";
import { parseMermaidModel } from "./parse-mermaid-model";

export const generateCanonicalModel = (
    inputPath: string,
    outputPath: string,
): void => {
    const source = fs.readFileSync(inputPath, "utf8");
    const model = parseMermaidModel(source);
    canonicalModelSchema.parse(model);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(model, null, 2)}\n`, "utf8");
};

const main = (): void => {
    const [inputPath, outputPath] = process.argv.slice(2);
    if (!inputPath || !outputPath) {
        throw new Error(
            "Usage: ts-node src/inputs/mermaid/generate-canonical-model.ts <input> <output>",
        );
    }
    generateCanonicalModel(inputPath, outputPath);
};

if (require.main === module) main();
