import {
    type ReactNode,
    useState,
} from "react";

import { AppointmentContext } from "./appointmentContextValue";

type AppointmentProviderProps = {
    children: ReactNode;
};

export function AppointmentProvider({ children }: AppointmentProviderProps) {
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [fields, setFields] = useState<string[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [generatedDocuments, setGeneratedDocuments] = useState<Blob | null>(
        null,
    );

    function resetAppointment() {
        setSelectedTemplates([]);
        setFields([]);
        setValues({});
        setGeneratedDocuments(null);
    }

    return (
        <AppointmentContext
            value={{
                selectedTemplates,
                fields,
                values,
                generatedDocuments,
                setSelectedTemplates,
                setFields,
                setValues,
                setGeneratedDocuments,
                resetAppointment,
            }}
        >
            {children}
        </AppointmentContext>
    );
}
