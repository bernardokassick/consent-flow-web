import { api } from "./api";

export async function getPdfFields(templates: string[]) {
    const response = await api.post<string[]>("/pdf/fields", {
        templates,
    });

    return response.data;
}

export async function fillMultiplePdfs(
    templates: string[],
    fields: Record<string, string>,
): Promise<Blob> {
    const response = await api.post(
        "/pdf/fill-multiple",
        {
            templates,
            fields,
        },
        {
            responseType: "blob",
        },
    );

    return response.data;
}
