import { getCollection } from "astro:content";
import { GuideMap } from "./guide-map.mjs";
import developer from "../data/guides/developer.yaml?raw";
import troubleshooting from "../data/guides/troubleshooting.yaml?raw";

//the graphs as the site uses them: checked once per build, with the urls and texts of each node
export class GuideMapSite {

    static TEXTS = { developer, troubleshooting };
    static _loading = new Map();

    static load(graph) {
        if (!GuideMapSite._loading.has(graph)) GuideMapSite._loading.set(graph, GuideMapSite._load(graph));
        return GuideMapSite._loading.get(graph);
    }

    //the graph whose folder holds this page, or null
    static graphOf(slug) {
        return Object.keys(GuideMap.GRAPHS).find(graph => slug.startsWith(GuideMap.GRAPHS[graph].folder)) ?? null;
    }

    static url(slug, anchor) {
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        return `${base}/${slug}/${anchor ? "#" + anchor : ""}`;
    }

    //a node on the question page of its graph
    static nodeUrl(graph, id) {
        return GuideMapSite.url(GuideMap.GRAPHS[graph].page) + (id ? "#" + id : "");
    }

    static async _load(graph) {
        const docs = await getCollection("docs");
        const pages = new Map(docs.map(entry => [entry.id, { title: entry.data.title, description: entry.data.description ?? "" }]));
        const map = GuideMap.load(GuideMapSite.TEXTS[graph], pages, GuideMap.GRAPHS[graph].folder);
        if (map.errors.length)
            throw new Error(`docs/src/data/guides/${graph}.yaml has problems:\n- ${map.errors.join("\n- ")}`);

        //what a page or the browser needs to show a node
        map.view = new Map();
        for (const node of map.nodes.values()) {
            const page = pages.get(node.page);
            map.view.set(node.id, {
                id: node.id,
                type: node.type,
                label: node.label,
                title: page ? page.title : node.label,
                description: page ? page.description : "",
                url: page ? GuideMapSite.url(node.page, node.anchor) : GuideMapSite.nodeUrl(graph, node.id)
            });
        }
        return map;
    }
}
