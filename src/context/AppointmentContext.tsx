import {
    type ReactNode,
    useState,
} from "react";

import type { PdfField } from "../types/PdfField";
import { AppointmentContext } from "./appointmentContextValue";

type AppointmentProviderProps = {
    children: ReactNode;
};

export function AppointmentProvider({ children }: AppointmentProviderProps) {
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [fields, setFields] = useState<PdfField[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [signatures, setSignatures] = useState<Record<string, string>>({});
    const [generatedDocuments, setGeneratedDocuments] = useState<Blob | null>(
        null,
    );

    function resetAppointment() {
        setSelectedTemplates([]);
        setFields([]);
        setValues({});
        setSignatures({});
        setGeneratedDocuments(null);
    }

    return (
        <AppointmentContext
            value={{
                selectedTemplates,
                fields,
                values,
                signatures,
                generatedDocuments,
                setSelectedTemplates,
                setFields,
                setValues,
                setSignatures,
                setGeneratedDocuments,
                resetAppointment,
            }}
        >
            {children}
        </AppointmentContext>
    );
}
