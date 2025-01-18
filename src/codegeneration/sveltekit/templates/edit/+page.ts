import type { PageLoad } from "./$types";
import type { {{typeImports}} } from "$lib/types";
import { {{apiImports}} } from "$lib/api";

export const load: PageLoad = async ({params}) => {
    const id = +params.id;
    const [{{responses}}] = await Promise.all([
        {{promises}}
    ]);

    if ({{statuscheck}}) {
        {{assignments}}

        return { {{returns}} };
    } else {
        throw new Error("Failed to load data");
    }
};
