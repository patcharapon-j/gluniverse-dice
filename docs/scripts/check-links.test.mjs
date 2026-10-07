import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LinkCheck } from "./check-links.mjs";

const B = "/foundryvtt-dice-so-nice/";

const MAP = `<section data-node="start"><a href="${B}a/">a</a></section><section data-node="guide-a"></section>`;

//a tiny built site: { "a/": html, ... }, with both question pages unless a page is set to null
function site(pages) {
    const dir = mkdtempSync(join(tmpdir(), "dsn-links-"));
    const all = { "api/start/": MAP, "troubleshooting/": `<section data-node="start"></section>`, ...pages };
    for (const [path, html] of Object.entries(all)) {
        if (html === null) continue;
        mkdirSync(join(dir, path), { recursive: true });
        writeFileSync(join(dir, path, "index.html"), html);
    }
    return dir;
}

test("a clean site has no problem", () => {
    const dir = site({
        "api/start/": MAP,
        "a/": `<h2 id="part">Part</h2><a href="${B}api/start/#guide-a">start</a><a href="#part">here</a>`
    });
    try {
        assert.deepEqual(LinkCheck.check(dir, ["a/"]), []);
    } finally { rmSync(dir, { recursive: true }); }
});

test("a link to a missing page names the page it came from", () => {
    const dir = site({ "api/start/": MAP, "a/": `<a href="${B}gone/">x</a>` });
    try {
        const problems = LinkCheck.check(dir, []);
        assert.ok(problems.some(problem => problem.startsWith("a/index.html") && problem.includes(`${B}gone/`)));
    } finally { rmSync(dir, { recursive: true }); }
});

test("a link to a missing anchor is reported", () => {
    const dir = site({ "api/start/": MAP, "a/": `<h2 id="part">Part</h2>`, "b/": `<a href="${B}a/#nope">x</a>` });
    try {
        assert.ok(LinkCheck.check(dir, []).some(problem => problem.includes(`${B}a/#nope`)));
    } finally { rmSync(dir, { recursive: true }); }
});

test("a link to a question page checks its node ids, not the anchors", () => {
    const dir = site({ "api/start/": MAP, "a/": `<a href="${B}api/start/#guide-a">ok</a><a href="${B}api/start/#guide-z">bad</a>` });
    try {
        const problems = LinkCheck.check(dir, []);
        assert.equal(problems.length, 1);
        assert.ok(problems[0].includes("#guide-z") && problems[0].includes("node of its question page"));
    } finally { rmSync(dir, { recursive: true }); }
});

test("a page people link to that is gone is reported", () => {
    const dir = site({ "api/start/": MAP });
    try {
        assert.ok(LinkCheck.check(dir, ["api/roll/"]).some(problem => problem.startsWith("api/roll/ is gone")));
    } finally { rmSync(dir, { recursive: true }); }
});

test("on a question page, a hash link is a node or a real anchor", () => {
    const dir = site({ "api/start/": MAP + `<span id="_top"></span><a href="#_top">top</a><a href="#guide-a">a</a><a href="#nothing">x</a>`, "a/": "" });
    try {
        const problems = LinkCheck.check(dir, []);
        assert.equal(problems.length, 1);
        assert.ok(problems[0].includes("#nothing"));
    } finally { rmSync(dir, { recursive: true }); }
});

test("a link without the base is reported", () => {
    const dir = site({ "api/start/": MAP, "a/": `<a href="/api/roll/">x</a>` });
    try {
        assert.ok(LinkCheck.check(dir, []).some(problem => problem.includes("/api/roll/ is missing the base")));
    } finally { rmSync(dir, { recursive: true }); }
});

test("a relative link is checked from its page", () => {
    const dir = site({ "api/start/": MAP, "a/": "", "a/b/": `<h2 id="part">Part</h2>`, "a/c/": `<a href="../b/#part">ok</a><a href="../gone/">bad</a>` });
    try {
        const problems = LinkCheck.check(dir, []);
        assert.equal(problems.length, 1);
        assert.ok(problems[0].includes("../gone/"));
    } finally { rmSync(dir, { recursive: true }); }
});

test("external links are not checked", () => {
    const dir = site({ "api/start/": MAP, "a/": `<a href="https://gitlab.com/x">x</a><a href="mailto:a@b.c">m</a><a href="//cdn.example/x">c</a>` });
    try {
        assert.deepEqual(LinkCheck.check(dir, []), []);
    } finally { rmSync(dir, { recursive: true }); }
});

test("a missing question page, or one without its cards, is reported", () => {
    const noMap = site({ "a/": "", "troubleshooting/": null });
    const noData = site({ "api/start/": "<p>start</p>" });
    try {
        assert.ok(LinkCheck.check(noMap, []).some(problem => problem.includes("was not built")));
        assert.ok(LinkCheck.check(noData, []).some(problem => problem.includes("has no cards")));
    } finally {
        rmSync(noMap, { recursive: true });
        rmSync(noData, { recursive: true });
    }
});
