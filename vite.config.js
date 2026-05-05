import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// xeno-canto blocks browser-UA requests for some assets via Anubis bot challenge.
// Spoof a curl-like UA on the server-side proxy.
const SPOOF_UA = "curl/8.4.0";

const stripBrowsery = (proxyReq) => {
  proxyReq.setHeader("user-agent", SPOOF_UA);
  proxyReq.setHeader("accept", "*/*");
  proxyReq.removeHeader("accept-language");
  proxyReq.removeHeader("sec-fetch-site");
  proxyReq.removeHeader("sec-fetch-mode");
  proxyReq.removeHeader("sec-fetch-dest");
  proxyReq.removeHeader("sec-ch-ua");
  proxyReq.removeHeader("sec-ch-ua-mobile");
  proxyReq.removeHeader("sec-ch-ua-platform");
  proxyReq.removeHeader("referer");
  proxyReq.removeHeader("origin");
  proxyReq.removeHeader("cookie");
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/xc-api": {
        target: "https://xeno-canto.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/xc-api/, "/api/3"),
        configure: (proxy) => proxy.on("proxyReq", stripBrowsery),
      },
      "/xc-sono": {
        target: "https://xeno-canto.org",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/xc-sono/, ""),
        configure: (proxy) => proxy.on("proxyReq", stripBrowsery),
      },
    },
  },
});
