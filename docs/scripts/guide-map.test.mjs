import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { GuideMap } from "../src/lib/guide-map.mjs";

const pages = new Map([
    ["api/quick/a", { title: "A", description: "a" }],
    ["api/quick/b", { title: "B", description: "b" }],
    ["guide/c", { title: "C", description: "c" }]
]);

const VALID = `
start:
  type: question
  label: Start
  question: What are you working on?
  answers:
    - label: First
      to: q1
    - label: Third
      to: c
q1:
  type: question
  label: Q1
  question: Which one?
  answers:
    - label: A
      to: a
    - label: B
      to: b
a:
  type: guide
  label: A
  page: api/quick/a
  related: [b]
b:
  type: guide
  label: B
  page: api/quick/b
c:
  type: link
  label: C
  page: guide/c
`;

const load = (yaml, withPages = pages) => GuideMap.load(yaml, withPages, "api/quick/");
const has = (map, text) => map.errors.some(error => error.includes(text));

test("a valid graph has no errors and the right path", () => {
    const map = load(VALID);
    assert.deepEqual(map.errors, []);
    assert.equal(map.parent.get("a"), "q1");
    assert.equal(map.parent.get("q1"), GuideMap.ROOT);
});

test("a YAML syntax mistake is reported with its line", () => {
    const map = load(VALID.replace("label: Q1", "label: I'm new: how?"));
    assert.equal(map.errors.length, 1);
    assert.match(map.errors[0], /line \d+/);
});

test("an unknown key names the node and the key", () => {
    const map = load(VALID.replace("related: [b]", "relatd: [b]"));
    assert.ok(has(map, '"a": unknown key "relatd"'));
});

test("a missing field names the node", () => {
    const map = load(VALID.replace("  page: api/quick/b\n", ""));
    assert.ok(has(map, '"b": a guide needs a "page"'));
});

test("an empty file, or a graph without start, is an error", () => {
    assert.ok(has(load(""), "the map is empty"));
    assert.ok(has(load(VALID.replace(/^start:/m, "begin:")), 'needs a "start" node'));
});

test("an answer to an unknown node names the question and the target", () => {
    const map = load(VALID.replace("to: b\n", "to: nowhere\n"));
    assert.ok(has(map, '"q1": the answer "B" leads to "nowhere"'));
});

test("a node reached by two answers is an error", () => {
    const map = load(VALID.replace("to: c\n", "to: a\n").replace(/c:\n  type: link\n  label: C\n  page: guide\/c\n/, ""));
    assert.ok(has(map, '"a": two answers lead here'));
});

test("a node no answer reaches is an error, and a loop of them does not hang", () => {
    const map = load(VALID + `
x:
  type: question
  label: X
  question: X?
  answers:
    - label: to y
      to: y
y:
  type: question
  label: Y
  question: Y?
  answers:
    - label: to x
      to: x
`);
    assert.ok(has(map, '"x": no answer leads to this node'));
    assert.ok(has(map, '"y": no answer leads to this node'));
});

test("a guide pointing to a missing page is an error", () => {
    const map = load(VALID.replace("page: api/quick/b", "page: api/quick/missing"));
    assert.ok(has(map, '"b": the page "api/quick/missing" doesn\'t exist'));
});

test("a page of the folder with no node is an error", () => {
    const morePages = new Map(pages).set("api/quick/orphan", { title: "O", description: "o" });
    assert.ok(has(load(VALID, morePages), 'the page "api/quick/orphan" has no node'));
});

test("an unknown related node is an error", () => {
    const map = load(VALID.replace("related: [b]", "related: [b, ghost]"));
    assert.ok(has(map, '"a": the related node "ghost" doesn\'t exist'));
});

test("a guide five answers away from the start is an error", () => {
    const chain = ["start", "q1", "q2", "q3", "q4"].map((id, index, ids) => `
${id}:
  type: question
  label: ${id}
  question: ${id}?
  answers:
    - label: next
      to: ${ids[index + 1] ?? "a"}
`).join("") + `
a:
  type: guide
  label: A
  page: api/quick/a
b:
  type: guide
  label: B
  page: api/quick/b
`;
    const map = load(chain.replace("      to: a\n", "      to: a\n    - label: b\n      to: b\n"));
    assert.ok(has(map, '"a": 5 answers away from the start'));
});

test("the node of a shared page is the first met from start, preferring one without an anchor", () => {
    const yaml = VALID
        .replace("    - label: First\n      to: q1\n", "    - label: Shortcut\n      to: a-part\n    - label: First\n      to: q1\n")
        + `
a-part:
  type: guide
  label: A, a part of it
  page: api/quick/a
  anchor: part
`;
    const map = load(yaml);
    assert.deepEqual(map.errors, []);
    assert.equal(GuideMap.nodeForPage(map, "api/quick/a").id, "a");
});

test("the real graphs of the docs are valid", () => {
    const root = fileURLToPath(new URL("../src/content/docs/", import.meta.url));
    const docs = new Map();
    (function walk(dir) {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (statSync(path).isDirectory()) walk(path);
            else if (/\.mdx?$/.test(name)) docs.set(relative(root, path).replace(/\.mdx?$/, "").replace(/\/index$/, ""), {});
        }
    })(root);
    for (const [graph, { folder }] of Object.entries(GuideMap.GRAPHS)) {
        const yaml = readFileSync(new URL(`../src/data/guides/${graph}.yaml`, import.meta.url), "utf8");
        assert.deepEqual(GuideMap.load(yaml, docs, folder).errors, [], graph);
    }
});

test("an answer leading back to start is an error", () => {
    const map = load(VALID.replace("      to: b\n", "      to: start\n").replace(/b:\n  type: guide\n  label: B\n  page: api\/quick\/b\n/, ""), new Map([...pages].filter(([slug]) => slug !== "api/quick/b")));
    assert.ok(has(map, '"q1": an answer can\'t lead back to "start"'));
});

test("an unknown type, a related that is not a list, and a question without text are errors", () => {
    assert.ok(has(load(VALID.replace("  type: link", "  type: quiz")), '"c": the type should be question, guide or link, not "quiz"'));
    assert.ok(has(load(VALID.replace("related: [b]", "related: b")), '"a": "related" should be a list of node ids'));
    assert.ok(has(load(VALID.replace("  question: Which one?\n", "")), '"q1": a question needs a "question"'));
});

test("an answer without a target, or with an unknown key, is an error", () => {
    assert.ok(has(load(VALID.replace("    - label: B\n      to: b\n", "    - label: B\n")), '"q1": each answer needs a "label" and a "to"'));
    assert.ok(has(load(VALID.replace("    - label: B\n      to: b\n", "    - label: B\n      to: b\n      hnt: typo\n")), '"q1": unknown key "hnt" in an answer'));
});

test("a page with no node has no node", () => {
    assert.equal(GuideMap.nodeForPage(load(VALID), "api/quick/none"), null);
});
