import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules"))
                        return undefined;
                    if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
                        return "react-vendor";
                    }
                    if (id.includes("lucide-react") || id.includes("radix-ui") || id.includes("cmdk")) {
                        return "ui-vendor";
                    }
                    if (id.includes("date-fns") || id.includes("react-day-picker")) {
                        return "date-vendor";
                    }
                    if (id.includes("html2canvas") || id.includes("jspdf") || id.includes("dompurify")) {
                        return "export-vendor";
                    }
                    return "vendor";
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "next/navigation": path.resolve(__dirname, "./src/shims/next-navigation.ts"),
            "next/link": path.resolve(__dirname, "./src/shims/next-link.tsx"),
            "next/image": path.resolve(__dirname, "./src/shims/next-image.tsx")
        }
    }
});
