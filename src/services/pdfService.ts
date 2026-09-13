import { api } from "./api";
import type { PdfField } from "../types/PdfField";
import type { PdfTemplate } from "../types/PdfTemplate";

export async function getPdfTemplates(): Promise<PdfTemplate[]> {
    const response = await api.get<PdfTemplate[]>("/pdf/templates");

    return response.data;
}

export async function getPdfFields(templates: string[]): Promise<PdfField[]> {
    const response = await api.post<PdfField[]>("/pdf/fields", {
        templates,
    });

    return response.data;
}

export async function fillMultiplePdfs(
    templates: string[],
    fields: Record<string, string>,
    signatures: Record<string, string>,
): Promise<Blob> {
    const response = await api.post(
        "/pdf/fill-multiple",
        {
            templates,
            fields,
            signatures,
        },
        {
            responseType: "blob",
        },
    );

    return response.data;
}

export async function previewPdf(
    template: string,
    fields: Record<string, string>,
): Promise<Blob> {
    const response = await api.post(
        "/pdf/preview",
        {
            template,
            fields,
        },
        {
            responseType: "blob",
        },
    );

    return response.data;
}

export async function getTemplatePreview(templateId: string): Promise<Blob> {
    const response = await api.get(
        `/pdf/templates/${encodeURIComponent(templateId)}/preview`,
        {
            responseType: "blob",
        },
    );

    return response.data;
}
