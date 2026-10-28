export type PdfFieldType =
    | "TEXT"
    | "MONEY"
    | "CPF"
    | "DATE"
    | "PHONE"
    | "EMAIL"
    | "SINGLE_CHOICE"
    | "SIGNATURE";

export interface PdfField {
    key: string;
    label: string;
    type?: PdfFieldType;
}
