import { createContext, type Dispatch, type SetStateAction } from "react";

import type { GeneratedDocuments } from "../types/GeneratedDocuments";
import type { PdfField } from "../types/PdfField";

export interface AppointmentContextType {
    selectedTemplates: string[];
    selectedDoctorId: string | null;
    fields: PdfField[];
    values: Record<string, string>;
    signatures: Record<string, string>;
    generatedDocuments: GeneratedDocuments | null;
    setSelectedTemplates: Dispatch<SetStateAction<string[]>>;
    setSelectedDoctorId: Dispatch<SetStateAction<string | null>>;
    setFields: Dispatch<SetStateAction<PdfField[]>>;
    setValues: Dispatch<SetStateAction<Record<string, string>>>;
    setSignatures: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratedDocuments: Dispatch<SetStateAction<GeneratedDocuments | null>>;
    resetAppointment: () => void;
}

export const AppointmentContext = createContext<AppointmentContextType | null>(
    null,
);
