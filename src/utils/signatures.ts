import type { PdfField } from "../types/PdfField";

const backendManagedSignatureKeys = new Set(["doctor_signature"]);

export function filterSignaturesForFields(
    signatures: Record<string, string>,
    fields: PdfField[],
) {
    const fieldKeys = new Set(fields.map((field) => field.key));

    return Object.fromEntries(
        Object.entries(signatures).filter(
            ([signatureKey]) =>
                fieldKeys.has(signatureKey) &&
                !backendManagedSignatureKeys.has(signatureKey),
        ),
    );
}
