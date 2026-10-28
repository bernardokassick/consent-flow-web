import type { PdfField } from "../types/PdfField";

const contractFieldOrder: readonly string[] = [
    "contract_procedure",
    "contract_procedure_date",
    "contract_value",
    "contract_payment",
];

export function isContractField(field: PdfField): boolean {
    return contractFieldOrder.includes(field.key);
}

export function getContractFields(fields: PdfField[]): PdfField[] {
    return fields.filter(isContractField).sort(
        (first, second) =>
            contractFieldOrder.indexOf(first.key) -
            contractFieldOrder.indexOf(second.key),
    );
}
