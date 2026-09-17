import {
    type KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type { Doctor } from "../../types/Doctor";
import "./DoctorSelect.css";

interface DoctorSelectProps {
    doctors: Doctor[];
    error: string | null;
    loading: boolean;
    onChange: (doctorId: string) => void;
    value: string | null;
}

function getDoctorLabel(doctor: Doctor) {
    return `${doctor.name} - ${doctor.crm}`;
}

export function DoctorSelect({
    doctors,
    error,
    loading,
    onChange,
    value,
}: DoctorSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedDoctor = useMemo(
        () => doctors.find((doctor) => doctor.id === value) ?? null,
        [doctors, value],
    );
    const hasOptions = doctors.length > 0;
    const canOpen = !loading && !error && hasOptions;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const selectedIndex = doctors.findIndex((doctor) => doctor.id === value);

        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }, [doctors, isOpen, value]);

    function toggleDropdown() {
        if (!canOpen) {
            return;
        }

        setIsOpen((currentIsOpen) => !currentIsOpen);
    }

    function selectDoctor(doctorId: string) {
        onChange(doctorId);
        setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "Escape") {
            setIsOpen(false);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (!isOpen) {
                setIsOpen(canOpen);
                return;
            }

            setFocusedIndex((currentIndex) =>
                Math.min(currentIndex + 1, doctors.length - 1),
            );
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
                setIsOpen(canOpen);
                return;
            }

            setFocusedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (!isOpen) {
                setIsOpen(canOpen);
                return;
            }

            const focusedDoctor = doctors[focusedIndex];

            if (focusedDoctor) {
                selectDoctor(focusedDoctor.id);
            }
        }
    }

    return (
        <div className="doctor-select" ref={containerRef}>
            <button
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="doctor-select-trigger"
                disabled={loading || Boolean(error)}
                onClick={toggleDropdown}
                onKeyDown={handleKeyDown}
                type="button"
            >
                <span className="doctor-select-value">
                    <strong>
                        {loading
                            ? "Carregando médicos..."
                            : selectedDoctor?.name ?? "Selecione o médico"}
                    </strong>
                    <span>
                        {error ??
                            selectedDoctor?.crm ??
                            (!loading && !hasOptions
                                ? "Nenhum médico disponível."
                                : "Médico responsável")}
                    </span>
                </span>
                <span
                    aria-hidden="true"
                    className={`doctor-select-arrow${isOpen ? " open" : ""}`}
                >
                    ▾
                </span>
            </button>

            {isOpen ? (
                <div className="doctor-select-menu" role="listbox">
                    {doctors.map((doctor, index) => (
                        <button
                            aria-label={getDoctorLabel(doctor)}
                            aria-selected={doctor.id === value}
                            className={`doctor-select-option${
                                doctor.id === value ? " selected" : ""
                            }${index === focusedIndex ? " focused" : ""}`}
                            key={doctor.id}
                            onClick={() => selectDoctor(doctor.id)}
                            onMouseEnter={() => setFocusedIndex(index)}
                            role="option"
                            type="button"
                        >
                            <span>
                                <strong>{doctor.name}</strong>
                                <small>{doctor.crm}</small>
                            </span>
                            {doctor.id === value ? (
                                <span aria-hidden="true" className="doctor-select-check">
                                    ✓
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
