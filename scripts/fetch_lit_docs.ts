const urls = [
    "https://lit.dev/docs/",
    "https://lit.dev/docs/getting-started/",
    "https://lit.dev/docs/components/overview/",
    "https://lit.dev/docs/components/defining/",
    "https://lit.dev/docs/components/rendering/",
    "https://lit.dev/docs/components/properties/",
    "https://lit.dev/docs/components/styles/",
    "https://lit.dev/docs/components/lifecycle/",
    "https://lit.dev/docs/components/shadow-dom/",
    "https://lit.dev/docs/components/events/",
    "https://lit.dev/docs/components/decorators/",
    "https://lit.dev/docs/templates/overview/",
    "https://lit.dev/docs/templates/expressions/",
    "https://lit.dev/docs/templates/conditionals/",
    "https://lit.dev/docs/templates/lists/",
    "https://lit.dev/docs/templates/directives/",
    "https://lit.dev/docs/templates/custom-directives/",
    "https://lit.dev/docs/composition/overview/",
    "https://lit.dev/docs/composition/component-composition/",
    "https://lit.dev/docs/composition/mixins/",
    "https://lit.dev/docs/composition/controllers/",
    "https://lit.dev/docs/data/context/",
    "https://lit.dev/docs/data/task/",
    "https://lit.dev/docs/data/signals/",
    "https://lit.dev/docs/api/LitElement/",
    "https://lit.dev/docs/api/Templates/",
    "https://lit.dev/docs/api/Directives/",
    "https://lit.dev/docs/api/Styles/",
    "https://lit.dev/docs/api/Decorators/",
];

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";

async function fileExists(path: string) {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function fetchDoc(url: string) {
    const jinaUrl = `https://r.jina.ai/${url}`;

    let relativePath = url.replace("https://lit.dev/docs/", "");
    if (relativePath === "" || relativePath === "/") {
        relativePath = "index.md";
    } else {
        if (relativePath.endsWith("/")) {
            relativePath = relativePath.slice(0, -1);
        }
        relativePath += ".md";
    }

    const filePath = join("docs", "lit", relativePath.toLowerCase());

    if (await fileExists(filePath)) {
        const s = await stat(filePath);
        if (s.size > 100) { // Basic check to see if it's not an error message
            console.log(`Skipping existing ${filePath}`);
            return;
        }
    }

    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(jinaUrl);
        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return;
        }
        const content = await response.text();

        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, content);
        console.log(`Saved to ${filePath}`);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
    }
}

async function fetchDocs() {
    const concurrency = 5;
    for (let i = 0; i < urls.length; i += concurrency) {
        const chunk = urls.slice(i, i + concurrency);
        await Promise.all(chunk.map(fetchDoc));
    }
}

fetchDocs();
