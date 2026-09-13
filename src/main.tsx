import { ClerkProvider } from "@clerk/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { appPaths } from "./routes/appPaths.ts";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.");
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={publishableKey}
            signInFallbackRedirectUrl={appPaths.dashboard}
            signInUrl={appPaths.login}
        >
            <App />
        </ClerkProvider>
    </StrictMode>,
);
