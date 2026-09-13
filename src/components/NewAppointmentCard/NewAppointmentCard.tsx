import { useNavigate } from "react-router-dom";

import { appPaths } from "../../routes/appPaths";
import "./NewAppointmentCard.css";

export function NewAppointmentCard() {
    const navigate = useNavigate();

    return (
        <section className="appointment-hero">
            <div>
                <h1>Novo Agendamento</h1>
                <p>
                    Agende uma nova visita do paciente e gere automaticamente os
                    termos de consentimento necessarios para o procedimento.
                </p>
            </div>
            <button
                className="new-appointment-button"
                onClick={() => navigate(appPaths.appointment.select)}
                type="button"
            >
                <span>Novo Agendamento</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </section>
    );
}
