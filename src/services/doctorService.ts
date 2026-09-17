import { api } from "./api";
import type { Doctor } from "../types/Doctor";

export async function getDoctors(signal?: AbortSignal): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>("/doctors", {
        signal,
    });

    return response.data;
}
