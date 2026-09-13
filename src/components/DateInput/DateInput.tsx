import { useEffect, useMemo, useRef, useState } from "react";

import { formatDateInput } from "../../utils/masks";
import "./DateInput.css";

interface DateInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxDate?: Date;
}

type CalendarViewMode = "day" | "month" | "year";

const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

const shortMonthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const yearsPerPage = 16;

function parseDisplayDate(value: string): Date | null {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return null;
    }

    const [, dayValue, monthValue, yearValue] = match;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function formatDisplayDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${day}/${month}/${year}`;
}

function getYearPageStart(year: number) {
    return Math.floor(year / yearsPerPage) * yearsPerPage;
}

function isSameDay(firstDate: Date | null, secondDate: Date) {
    return (
        firstDate?.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
    );
}

function isAfterMaxDate(date: Date, maxDate?: Date) {
    if (!maxDate) {
        return false;
    }

    const comparableDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const comparableMaxDate = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate(),
    );

    return comparableDate > comparableMaxDate;
}

export function DateInput({ id, label, value, onChange, maxDate }: DateInputProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedDate = parseDisplayDate(value);
    const referenceDate = selectedDate ?? new Date();
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
    const [viewMonth, setViewMonth] = useState(referenceDate.getMonth());
    const [viewYear, setViewYear] = useState(referenceDate.getFullYear());
    const [yearPageStart, setYearPageStart] = useState(
        getYearPageStart(referenceDate.getFullYear()),
    );

    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const leadingEmptyDays = firstDayOfMonth.getDay();

        return [
            ...Array.from({ length: leadingEmptyDays }, () => null),
            ...Array.from({ length: daysInMonth }, (_, dayIndex) => dayIndex + 1),
        ];
    }, [viewMonth, viewYear]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handlePointerDown(event: PointerEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    function openCalendar() {
        const nextReferenceDate = parseDisplayDate(value) ?? new Date();

        setViewMonth(nextReferenceDate.getMonth());
        setViewYear(nextReferenceDate.getFullYear());
        setYearPageStart(getYearPageStart(nextReferenceDate.getFullYear()));
        setViewMode("day");
        setIsOpen((currentValue) => !currentValue);
    }

    function changeMonth(direction: -1 | 1) {
        const nextDate = new Date(viewYear, viewMonth + direction, 1);

        setViewMonth(nextDate.getMonth());
        setViewYear(nextDate.getFullYear());
    }

    function selectDay(day: number) {
        const nextDate = new Date(viewYear, viewMonth, day);

        if (isAfterMaxDate(nextDate, maxDate)) {
            return;
        }

        onChange(formatDisplayDate(nextDate));
        setIsOpen(false);
    }

    function selectMonth(month: number) {
        setViewMonth(month);
        setViewMode("day");
    }

    function selectYear(year: number) {
        setViewYear(year);
        setViewMode("month");
    }

    return (
        <>
            <label htmlFor={id}>{label}</label>
            <div className="date-input-wrapper" ref={containerRef}>
                <input
                    id={id}
                    inputMode="numeric"
                    onChange={(event) =>
                        onChange(formatDateInput(event.target.value))
                    }
                    placeholder="dd/mm/aaaa"
                    type="text"
                    value={value}
                />
                <button
                    aria-expanded={isOpen}
                    aria-label="Selecionar data"
                    className="date-picker-button"
                    onClick={openCalendar}
                    type="button"
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M8 2v4M16 2v4M3 9h18" />
                        <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                    </svg>
                </button>

                {isOpen ? (
                    <div className="date-picker-popover">
                        <div className="date-picker-header">
                            <button
                                aria-label={
                                    viewMode === "year"
                                        ? "Grupo de anos anterior"
                                        : "Mês anterior"
                                }
                                onClick={() =>
                                    viewMode === "year"
                                        ? setYearPageStart(
                                              (currentYear) =>
                                                  currentYear - yearsPerPage,
                                          )
                                        : changeMonth(-1)
                                }
                                type="button"
                            >
                                ‹
                            </button>

                            {viewMode === "year" ? (
                                <span>
                                    {yearPageStart} –{" "}
                                    {yearPageStart + yearsPerPage - 1}
                                </span>
                            ) : (
                                <div className="date-picker-title">
                                    <button
                                        onClick={() => setViewMode("month")}
                                        type="button"
                                    >
                                        {monthNames[viewMonth]}
                                    </button>
                                    <button
                                        onClick={() => setViewMode("year")}
                                        type="button"
                                    >
                                        {viewYear}
                                    </button>
                                </div>
                            )}

                            <button
                                aria-label={
                                    viewMode === "year"
                                        ? "Próximo grupo de anos"
                                        : "Próximo mês"
                                }
                                onClick={() =>
                                    viewMode === "year"
                                        ? setYearPageStart(
                                              (currentYear) =>
                                                  currentYear + yearsPerPage,
                                          )
                                        : changeMonth(1)
                                }
                                type="button"
                            >
                                ›
                            </button>
                        </div>

                        {viewMode === "day" ? (
                            <>
                                <div className="date-picker-weekdays">
                                    {weekDays.map((weekDay) => (
                                        <span key={weekDay}>{weekDay}</span>
                                    ))}
                                </div>
                                <div className="date-picker-days">
                                    {calendarDays.map((day, index) =>
                                        day ? (
                                            <button
                                                className={
                                                    isSameDay(
                                                        selectedDate,
                                                        new Date(
                                                            viewYear,
                                                            viewMonth,
                                                            day,
                                                        ),
                                                    )
                                                        ? "selected"
                                                        : ""
                                                }
                                                disabled={isAfterMaxDate(
                                                    new Date(
                                                        viewYear,
                                                        viewMonth,
                                                        day,
                                                    ),
                                                    maxDate,
                                                )}
                                                key={`${viewYear}-${viewMonth}-${day}`}
                                                onClick={() => selectDay(day)}
                                                type="button"
                                            >
                                                {day}
                                            </button>
                                        ) : (
                                            <span
                                                aria-hidden="true"
                                                key={`empty-${index}`}
                                            />
                                        ),
                                    )}
                                </div>
                            </>
                        ) : null}

                        {viewMode === "month" ? (
                            <div className="date-picker-months">
                                {shortMonthNames.map((month, monthIndex) => (
                                    <button
                                        className={
                                            monthIndex === viewMonth ? "selected" : ""
                                        }
                                        key={month}
                                        onClick={() => selectMonth(monthIndex)}
                                        type="button"
                                    >
                                        {month}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {viewMode === "year" ? (
                            <div className="date-picker-years">
                                {Array.from(
                                    { length: yearsPerPage },
                                    (_, yearIndex) => yearPageStart + yearIndex,
                                ).map((year) => (
                                    <button
                                        className={
                                            year === viewYear ? "selected" : ""
                                        }
                                        key={year}
                                        onClick={() => selectYear(year)}
                                        type="button"
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </>
    );
}
