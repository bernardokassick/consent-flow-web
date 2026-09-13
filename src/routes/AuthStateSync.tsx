import { useAuth } from "@clerk/react";
import { useEffect } from "react";

import { useAppointment } from "../hooks/useAppointment";

export function AuthStateSync() {
    const { isLoaded, isSignedIn } = useAuth();
    const { resetAppointment } = useAppointment();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            resetAppointment();
        }
    }, [isLoaded, isSignedIn, resetAppointment]);

    return null;
}
