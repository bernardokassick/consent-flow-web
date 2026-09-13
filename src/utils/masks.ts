export function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
        6,
        9,
    )}-${digits.slice(9)}`;
}

export function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 2) {
        return digits;
    }

    if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length === 0) {
        return "";
    }

    if (digits.length <= 2) {
        return `(${digits}`;
    }

    const areaCode = digits.slice(0, 2);
    const phoneNumber = digits.slice(2);

    if (digits.length <= 10) {
        if (phoneNumber.length <= 4) {
            return `(${areaCode}) ${phoneNumber}`;
        }

        return `(${areaCode}) ${phoneNumber.slice(0, 4)}-${phoneNumber.slice(
            4,
        )}`;
    }

    return `(${areaCode}) ${phoneNumber.slice(0, 5)}-${phoneNumber.slice(5)}`;
}

export function isoDateToDisplayDate(value: string): string {
    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
        return "";
    }

    return `${day}/${month}/${year}`;
}

export function displayDateToIsoDate(value: string): string {
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(datePattern);

    if (!match) {
        return "";
    }

    const [, day, month, year] = match;

    return `${year}-${month}-${day}`;
}
