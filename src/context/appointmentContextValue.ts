import { createContext, type Dispatch, type SetStateAction } from "react";

import type { PdfField } from "../types/PdfField";

export interface AppointmentContextType {
    selectedTemplates: string[];
    fields: PdfField[];
    values: Record<string, string>;
    generatedDocuments: Blob | null;
    setSelectedTemplates: Dispatch<SetStateAction<string[]>>;
    setFields: Dispatch<SetStateAction<PdfField[]>>;
    setValues: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratedDocuments: Dispatch<SetStateAction<Blob | null>>;
    resetAppointment: () => void;
}

export const AppointmentContext = createContext<AppointmentContextType | null>(
    null,
);
