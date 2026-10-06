import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { isCuratedIcon } from "../../src/lib/product-icons.ts";
import { refreshedSiteIcon, resolveSiteIcon } from "../../src/lib/site-icon.ts";

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

// Serves `/app/` with the given <head> markup; every path in `images` answers as
// an image, anything else falls through to an SPA-style 200 text/html rewrite.
async function withSite(head, images, run) {
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url, "http://localhost");
    const imageType = images[pathname];
    if (imageType) {
      response.writeHead(200, { "content-type": imageType });
      response.end(PNG);
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><head>${head}</head><body></body></html>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(origin);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("prefers a touch icon over a favicon declared without sizes", async () => {
  const head = '<link rel="icon" type="image/png" href="favicon.png"><link rel="apple-touch-icon" href="icons/Icon-192.png">';
  await withSite(head, { "/app/favicon.png": "image/png", "/app/icons/Icon-192.png": "image/png" }, async (origin) => {
    assert.equal(await resolveSiteIcon(`${origin}/app/`), `${origin}/app/icons/Icon-192.png`);
  });
});

test("prefers a scalable icon over a raster touch icon", async () => {
  const head = '<link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="favicon.svg">';
  await withSite(head, { "/app/apple-touch-icon.png": "image/png", "/app/favicon.svg": "image/svg+xml" }, async (origin) => {
    assert.equal(await resolveSiteIcon(`${origin}/app/`), `${origin}/app/favicon.svg`);
  });
});

test("picks the largest declared size among raster icons", async () => {
  const head = '<link rel="icon" sizes="16x16 32x32" href="small.png"><link rel="icon" sizes="192x192" href="large.png">';
  await withSite(head, { "/app/small.png": "image/png", "/app/large.png": "image/png" }, async (origin) => {
    assert.equal(await resolveSiteIcon(`${origin}/app/`), `${origin}/app/large.png`);
  });
});

test("skips a preferred candidate that answers with HTML", async () => {
  const head = '<link rel="icon" href="missing.svg"><link rel="icon" sizes="32x32" href="favicon.png">';
  await withSite(head, { "/app/favicon.png": "image/png" }, async (origin) => {
    assert.equal(await resolveSiteIcon(`${origin}/app/`), `${origin}/app/favicon.png`);
  });
});

test("refresh follows the icon a site declares now", async () => {
  const head = '<link rel="icon" href="new.svg">';
  await withSite(head, { "/app/new.svg": "image/svg+xml", "/old.png": "image/png" }, async (origin) => {
    const next = await refreshedSiteIcon({ url: `${origin}/app/`, iconUrl: `${origin}/old.png` });
    assert.equal(next, `${origin}/app/new.svg`);
  });
});

test("refresh keeps a working stored icon when nothing resolves", async () => {
  await withSite("", { "/stored.png": "image/png" }, async (origin) => {
    const next = await refreshedSiteIcon({ url: `${origin}/app/`, iconUrl: `${origin}/stored.png` });
    assert.equal(next, `${origin}/stored.png`);
  });
});

test("refresh clears a dead icon when the site offers nothing usable", async () => {
  await withSite("", {}, async (origin) => {
    assert.equal(await refreshedSiteIcon({ url: `${origin}/app/`, iconUrl: `${origin}/gone.png` }), null);
    assert.equal(await refreshedSiteIcon({ url: `${origin}/app/`, iconUrl: null }), null);
  });
});

test("recognises only bundled product icon paths as curated", () => {
  assert.equal(isCuratedIcon("/product-icons/clario.webp"), true);
  assert.equal(isCuratedIcon("/product-icons/qingsong-notes.svg"), true);
  assert.equal(isCuratedIcon("https://qisw.top/product-icons/clario.webp"), false);
  assert.equal(isCuratedIcon("/product-icons/../brand/siteharbor-icon.png"), false);
  assert.equal(isCuratedIcon("/product-icons/clario.js"), false);
  assert.equal(isCuratedIcon(null), false);
});
