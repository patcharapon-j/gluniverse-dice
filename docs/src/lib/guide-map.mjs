import yaml from "js-yaml";

//the graphs behind the question pages: reads a YAML file of src/data/guides/, checks it and builds the tree
//plain js so the pages, the footer of the guides and node --test share it
export class GuideMap {

    static ROOT = "start";
    static MAX_DEPTH = 4;

    //each graph: its question page, the folder whose pages need a node, and the link back to it from these pages
    static GRAPHS = {
        developer: { page: "api/start", folder: "api/quick/", back: "Back to Start here" },
        troubleshooting: { page: "troubleshooting", folder: "troubleshooting/", back: "Back to Troubleshooting" }
    };

    static KEYS = {
        question: ["type", "label", "question", "help", "answers", "related"],
        guide: ["type", "label", "page", "anchor", "related"],
        link: ["type", "label", "page", "anchor", "related"]
    };
    static ANSWER_KEYS = ["label", "hint", "to"];

    //text: the YAML file, pages: Map of docs slug -> { title, description }, folder: the pages that need a node
    //returns { nodes, parent, depth, order, errors }, nodes and errors being usable even when broken
    static load(text, pages, folder = null) {
        let data;
        try {
            data = yaml.load(text);
        } catch (err) {
            const line = err.mark ? ` (line ${err.mark.line + 1}, column ${err.mark.column + 1})` : "";
            return GuideMap._empty([`the YAML can't be read${line}: ${err.reason ?? err.message}`]);
        }
        if (!data || typeof data !== "object" || Array.isArray(data))
            return GuideMap._empty(["the map is empty: the file should list the nodes by id"]);

        const errors = [];
        const nodes = new Map();
        for (const [id, node] of Object.entries(data)) {
            if (GuideMap._checkNode(id, node, errors)) nodes.set(id, { id, ...node });
        }
        if (!nodes.has(GuideMap.ROOT)) errors.push(`the map needs a "${GuideMap.ROOT}" node`);

        const parent = GuideMap._parents(nodes, errors);
        for (const node of nodes.values()) {
            if (node.type !== "question" && pages && !pages.has(node.page))
                errors.push(`"${node.id}": the page "${node.page}" doesn't exist`);
            for (const id of node.related ?? []) {
                if (!nodes.has(id)) errors.push(`"${node.id}": the related node "${id}" doesn't exist`);
            }
        }

        const { depth, order } = GuideMap._walk(nodes);
        for (const node of nodes.values()) {
            if (!depth.has(node.id)) errors.push(`"${node.id}": no answer leads to this node`);
            else if (node.type !== "question" && depth.get(node.id) > GuideMap.MAX_DEPTH)
                errors.push(`"${node.id}": ${depth.get(node.id)} answers away from the start, the map allows ${GuideMap.MAX_DEPTH}`);
        }

        //every page of the folder needs a node, or no answer leads to it
        if (pages && folder) {
            const targeted = new Set([...nodes.values()].map(node => node.page));
            for (const slug of pages.keys()) {
                if (slug.startsWith(folder) && !targeted.has(slug))
                    errors.push(`the page "${slug}" has no node`);
            }
        }

        return { nodes, parent, depth, order, errors };
    }

    //the node of a page: the first met from the root, preferring one without an anchor
    static nodeForPage(map, slug) {
        const nodes = map.order.map(id => map.nodes.get(id)).filter(node => node.page === slug);
        return nodes.find(node => !node.anchor) ?? nodes[0] ?? null;
    }

    static _empty(errors) {
        return { nodes: new Map(), parent: new Map(), depth: new Map(), order: [], errors };
    }

    //true when the node can go in the graph, its problems are pushed in errors
    static _checkNode(id, node, errors) {
        if (!node || typeof node !== "object" || Array.isArray(node)) {
            errors.push(`"${id}": a node needs fields like type and label`);
            return false;
        }
        const keys = GuideMap.KEYS[node.type];
        if (!keys) {
            errors.push(`"${id}": the type should be question, guide or link, not "${node.type}"`);
            return false;
        }
        for (const key of Object.keys(node)) {
            if (!keys.includes(key)) errors.push(`"${id}": unknown key "${key}"`);
        }
        if (typeof node.label !== "string" || !node.label) errors.push(`"${id}": a node needs a "label"`);
        if (node.related !== undefined && !Array.isArray(node.related)) errors.push(`"${id}": "related" should be a list of node ids`);

        if (node.type === "question") {
            if (typeof node.question !== "string" || !node.question) errors.push(`"${id}": a question needs a "question"`);
            if (!Array.isArray(node.answers) || !node.answers.length) {
                errors.push(`"${id}": a question needs at least one answer`);
                return false;
            }
            for (const answer of node.answers) {
                if (!answer || typeof answer !== "object") {
                    errors.push(`"${id}": each answer needs a "label" and a "to"`);
                    return false;
                }
                for (const key of Object.keys(answer)) {
                    if (!GuideMap.ANSWER_KEYS.includes(key)) errors.push(`"${id}": unknown key "${key}" in an answer`);
                }
                if (typeof answer.label !== "string" || typeof answer.to !== "string") {
                    errors.push(`"${id}": each answer needs a "label" and a "to"`);
                    return false;
                }
            }
        }
        else if (typeof node.page !== "string" || !node.page) {
            errors.push(`"${id}": a ${node.type} needs a "page"`);
            return false;
        }
        return true;
    }

    //each node has one parent, the question whose answer leads to it
    static _parents(nodes, errors) {
        const parent = new Map();
        for (const node of nodes.values()) {
            for (const answer of node.answers ?? []) {
                if (!nodes.has(answer.to))
                    errors.push(`"${node.id}": the answer "${answer.label}" leads to "${answer.to}", which doesn't exist`);
                else if (answer.to === GuideMap.ROOT)
                    errors.push(`"${node.id}": an answer can't lead back to "${GuideMap.ROOT}"`);
                else if (parent.has(answer.to))
                    errors.push(`"${answer.to}": two answers lead here ("${parent.get(answer.to)}" and "${node.id}"), a node can only have one`);
                else
                    parent.set(answer.to, node.id);
            }
        }
        return parent;
    }

    //walk from the root in answer order: the depth of each node, and the order nodes are met
    static _walk(nodes) {
        const depth = new Map();
        const order = [];
        if (!nodes.has(GuideMap.ROOT)) return { depth, order };
        depth.set(GuideMap.ROOT, 0);
        const todo = [GuideMap.ROOT];
        while (todo.length) {
            const node = nodes.get(todo.shift());
            order.push(node.id);
            for (const answer of node.answers ?? []) {
                if (!nodes.has(answer.to) || depth.has(answer.to)) continue;
                depth.set(answer.to, depth.get(node.id) + 1);
                todo.push(answer.to);
            }
        }
        return { depth, order };
    }
}
