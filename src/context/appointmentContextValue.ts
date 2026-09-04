import { createContext, type Dispatch, type SetStateAction } from "react";

export interface AppointmentContextType {
    selectedTemplates: string[];
    fields: string[];
    values: Record<string, string>;
    generatedDocuments: Blob | null;
    setSelectedTemplates: Dispatch<SetStateAction<string[]>>;
    setFields: Dispatch<SetStateAction<string[]>>;
    setValues: Dispatch<SetStateAction<Record<string, string>>>;
    setGeneratedDocuments: Dispatch<SetStateAction<Blob | null>>;
    resetAppointment: () => void;
}

export const AppointmentContext = createContext<AppointmentContextType | null>(
    null,
);
