import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "./",
  worker: { format: "es" },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Focus & Snuggery",
        short_name: "Focus & Snuggery",
        description:
          "One small step at a time. A private daily-life companion.",
        theme_color: "#46644f",
        background_color: "#f7f8f2",
        display: "standalone",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: "CacheFirst",
            options: {
              cacheName: "focus-voice-runtime",
              expiration: { maxEntries: 3, purgeOnQuotaError: true },
            },
          },
        ],
        globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg,webp}"],
        maximumFileSizeToCacheInBytes: 8000000,
      },
    }),
  ],
});
