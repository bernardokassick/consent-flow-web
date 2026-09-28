import axios from "axios";

// const apiUrl = import.meta.env.VITE_API_URL;

// if (!apiUrl) {
//     throw new Error("VITE_API_URL is not configured");
// }

export const api = axios.create({
    baseURL: `http://localhost:8080/api`,
});
