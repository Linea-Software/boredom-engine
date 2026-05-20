/**
 * Serves the dist/ directory on localhost so scripts can be loaded via the bootloader.
 */
const PORT = 48325;
const distDir = new URL("../dist", import.meta.url).pathname;

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const filePath = distDir + url.pathname.replace(/\.\./g, "");
        const file = Bun.file(filePath);
        if (!(await file.exists()))
            return new Response("Not Found", { status: 404 });
        return new Response(file, {
            headers: {
                "Content-Type": filePath.endsWith(".js")
                    ? "application/javascript"
                    : "text/plain",
            },
        });
    },
});

console.log(`Serving dist/ at http://localhost:${PORT}`);
