//checks the built site, run it after astro build: node scripts/check-links.mjs
//internal links and their anchors, the pages people already link to, and the node links of the question pages

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { GuideMap } from "../src/lib/guide-map.mjs";

export class LinkCheck {

    static BASE = "/foundryvtt-dice-so-nice/";

    //pages people already link to: they must keep their url
    static KEEP = [
        "api/integration/", "api/hooks/", "api/roll/", "api/companion-messages/", "api/interactive-throws/",
        "api/customization/", "api/roles/", "api/terms/", "api/3d-models/", "api/texturepacker/",
        "api/dice-systems/", "api/system-settings/", "api/shaders/", "api/sfx/", "api/events/", "api/demos/",
        "addons/", "guide/getting-started/", "guide/appearance/", "guide/actor-appearance/", "guide/preferences/",
        "guide/special-effects/", "guide/performance/", "guide/save-files/", "guide/dice-library/",
        "guide/dice-editor/", "guide/custom-dice-terms/", "guide/persistent-dice/", "guide/interactive-throws/",
        "guide/rollable-area/", "guide/macros/"
    ];

    //returns the problems found in the built site in dir
    static check(dir, keep = LinkCheck.KEEP) {
        const files = LinkCheck._htmlFiles(dir);
        //each page is read once, its ids are collected when a link needs them
        const html = new Map();
        const htmlOf = (file) => {
            if (!html.has(file)) html.set(file, readFileSync(file, "utf8"));
            return html.get(file);
        };
        const ids = new Map();
        const idsOf = (file) => {
            if (!ids.has(file)) ids.set(file, new Set([...htmlOf(file).matchAll(/\sid="([^"]+)"/g)].map(match => match[1])));
            return ids.get(file);
        };
        const fileOf = (path) => LinkCheck._fileOf(dir, path);

        //the node ids of each question page, one card each
        const panels = new Map();
        const missing = [];
        for (const { page } of Object.values(GuideMap.GRAPHS)) {
            const file = fileOf(`${LinkCheck.BASE}${page}/`);
            if (!file) missing.push(`the question page ${page}/ was not built`);
            else panels.set(file, new Set([...htmlOf(file).matchAll(/\sdata-node="([^"]+)"/g)].map(match => match[1])));
        }

        //on a question page, a hash is a node or a real anchor
        const anchorOk = (file, hash) => idsOf(file).has(hash) || !!panels.get(file)?.has(hash);

        const problems = [];
        for (const file of files) {
            const from = relative(dir, file);
            for (const [, href] of htmlOf(file).matchAll(/\shref="([^"]+)"/g)) {
                if (href.startsWith("#")) {
                    const hash = decodeURIComponent(href.slice(1));
                    if (hash && !anchorOk(file, hash)) problems.push(`${from}: no anchor ${href} on this page`);
                    continue;
                }
                //external links
                if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) continue;
                //a relative link is resolved from the page it is on
                let link = href;
                if (!href.startsWith("/")) {
                    const url = new URL(href, `http://site${LinkCheck.BASE}${from.replace(/[^/]*$/, "")}`);
                    link = url.pathname + url.hash;
                }
                if (!link.startsWith(LinkCheck.BASE)) {
                    problems.push(`${from}: ${href} is missing the base ${LinkCheck.BASE}`);
                    continue;
                }
                const [path, hash] = link.split("?")[0].split("#");
                const target = fileOf(path);
                if (!target) problems.push(`${from}: ${href} points to a page that doesn't exist`);
                else if (hash && !anchorOk(target, decodeURIComponent(hash))) {
                    problems.push(`${from}: ${href} points to ${panels.has(target) ? "a node of its question page" : "an anchor"} that doesn't exist`);
                }
            }
        }

        for (const page of keep) {
            if (!fileOf(LinkCheck.BASE + page)) problems.push(`${page} is gone: people link to it, add a redirect`);
        }
        problems.push(...missing);
        for (const [file, nodes] of panels) {
            if (!nodes.size) problems.push(`${relative(dir, file)}: the question page has no cards`);
        }
        return problems;
    }

    static _htmlFiles(dir) {
        return readdirSync(dir, { recursive: true }).filter(name => name.endsWith(".html")).map(name => join(dir, name));
    }

    //the file a site path is served from, or null
    static _fileOf(dir, path) {
        const local = path.slice(LinkCheck.BASE.length);
        const candidates = local === "" || local.endsWith("/") ? [join(dir, local, "index.html")] : [join(dir, local), join(dir, local, "index.html")];
        return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const dir = fileURLToPath(new URL("../public/", import.meta.url));
    if (!existsSync(dir)) {
        console.error(`no build in ${dir}, run astro build first`);
        process.exit(1);
    }
    const problems = LinkCheck.check(dir);
    if (problems.length) {
        console.error(problems.join("\n"));
        console.error(`\n${problems.length} problem(s) found`);
        process.exit(1);
    }
    console.log("no broken link");
}
