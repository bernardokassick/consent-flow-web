export type PdfFieldType =
    | "TEXT"
    | "CPF"
    | "DATE"
    | "PHONE"
    | "EMAIL"
    | "SIGNATURE";

export interface PdfField {
    key: string;
    label: string;
    type?: PdfFieldType;
}
