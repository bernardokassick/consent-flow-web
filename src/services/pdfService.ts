import { api } from "./api";
import type { GeneratedDocuments } from "../types/GeneratedDocuments";
import type { PdfField } from "../types/PdfField";
import type { PdfTemplate } from "../types/PdfTemplate";

const defaultZipFilename = "documentos.zip";

function parseContentDispositionFilename(contentDisposition?: string) {
    if (!contentDisposition) {
        return defaultZipFilename;
    }

    const encodedFilenameMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/i,
    );

    if (encodedFilenameMatch?.[1]) {
        try {
            return decodeURIComponent(encodedFilenameMatch[1].trim());
        } catch {
            return encodedFilenameMatch[1].trim();
        }
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

    return filenameMatch?.[1]?.trim() || defaultZipFilename;
}

export async function getPdfTemplates(signal?: AbortSignal): Promise<PdfTemplate[]> {
    const response = await api.get<PdfTemplate[]>("/pdf/templates", {
        signal,
    });

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
    doctorId: string | null,
): Promise<GeneratedDocuments> {
    const response = await api.post(
        "/pdf/fill-multiple",
        {
            templates,
            fields,
            signatures,
            doctorId,
        },
        {
            responseType: "blob",
        },
    );

    return {
        blob: response.data,
        filename: parseContentDispositionFilename(
            response.headers["content-disposition"],
        ),
    };
}

export async function previewPdf(
    template: string,
    fields: Record<string, string>,
    signal?: AbortSignal,
): Promise<Blob> {
    const response = await api.post(
        "/pdf/preview",
        {
            template,
            fields,
        },
        {
            responseType: "blob",
            signal,
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
