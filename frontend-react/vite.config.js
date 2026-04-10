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
                    if (id.includes("vite/preload-helper")) {
                        return "preload-helper";
                    }
                    if (!id.includes("node_modules"))
                        return undefined;
                    if (id.includes("/node_modules/react/") ||
                        id.includes("/node_modules/react-dom/") ||
                        id.includes("/node_modules/react-router-dom/") ||
                        id.includes("/node_modules/react-router/") ||
                        id.includes("/node_modules/scheduler/")) {
                        return "react-vendor";
                    }
                    if (id.includes("@tanstack/react-query") || id.includes("axios")) {
                        return "data-vendor";
                    }
                    if (id.includes("antd")) {
                        return "antd-vendor";
                    }
                    if (id.includes("rsuite")) {
                        return "rsuite-vendor";
                    }
                    if (id.includes("@fullcalendar")) {
                        return "calendar-vendor";
                    }
                    if (id.includes("ckeditor5") || id.includes("@ckeditor/ckeditor5-react")) {
                        return "editor-vendor";
                    }
                    if (id.includes("xlsx")) {
                        return "xlsx-vendor";
                    }
                    if (id.includes("lucide-react") || id.includes("radix-ui") || id.includes("cmdk")) {
                        return "ui-vendor";
                    }
                    if (id.includes("date-fns") || id.includes("react-day-picker")) {
                        return "date-vendor";
                    }
                    if (id.includes("html2canvas") || id.includes("jspdf") || id.includes("jspdf-autotable") || id.includes("dompurify")) {
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
