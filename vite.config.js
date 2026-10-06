import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
var vite_config_default = defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },
  server: {
    port: 5175,
    proxy: { "/api": "http://localhost:3002" }
  },
  build: { outDir: "dist" }
});
export {
  vite_config_default as default
};
