import { useContext } from "react";

import { AppointmentContext } from "../context/appointmentContextValue";

export function useAppointment() {
    const context = useContext(AppointmentContext);

    if (!context) {
        throw new Error(
            "useAppointment must be used within an AppointmentProvider.",
        );
    }

    return context;
}
