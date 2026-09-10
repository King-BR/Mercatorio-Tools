const fs = require("fs");
const path = require("path");

const WEBSITE_URL = "https://play.mercatorio.io/";

const USER_AGENT = "Mercatorio-Tools/1.0 (+https://mercatorio-tools.tech)";

function ensureDirectory(directory) {
  fs.mkdirSync(directory, {
    recursive: true,
  });
}

function normalizeAssetUrl(asset, baseUrl) {
  try {
    return new URL(asset, baseUrl).toString();
  } catch {
    return null;
  }
}

function getSafeFilename(url) {
  const parsed = new URL(url);

  let filename = path.basename(parsed.pathname);

  if (!filename) {
    filename = "index.js";
  }

  // Avoid path traversal and filesystem-unfriendly characters.
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  return filename;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  return response.text();
}

/**
 * Extract JavaScript files directly referenced by HTML.
 */
function extractScriptUrls(html, baseUrl) {
  const urls = new Set();

  const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

  let match;

  while ((match = scriptPattern.exec(html)) !== null) {
    const url = normalizeAssetUrl(match[1], baseUrl);

    if (!url) {
      continue;
    }

    if (new URL(url).pathname.endsWith(".js")) {
      urls.add(url);
    }
  }

  return [...urls];
}

/**
 * Extract JS chunks referenced inside JavaScript files.
 *
 * This is useful because bundlers can load chunks dynamically,
 * so not every JS file necessarily appears in index.html.
 */
function extractJavaScriptUrls(source, baseUrl) {
  const urls = new Set();

  // Absolute/relative .js URLs appearing in source.
  const pattern = /(?:"|')([^"'\\\s]+\.js(?:\?[^"'\\\s]*)?)(?:"|')/g;

  let match;

  while ((match = pattern.exec(source)) !== null) {
    const candidate = match[1];

    const url = normalizeAssetUrl(candidate, baseUrl);

    if (!url) {
      continue;
    }

    if (new URL(url).pathname.endsWith(".js")) {
      urls.add(url);
    }
  }

  return [...urls];
}

/**
 * Recursively discover JavaScript assets.
 *
 * maxDepth prevents accidental crawling of unrelated resources.
 */
async function discoverJavaScriptAssets(options = {}) {
  const websiteUrl = options.websiteUrl ?? WEBSITE_URL;
  const maxDepth = options.maxDepth ?? 3;

  const visited = new Set();
  const discovered = new Set();

  async function visit(url, depth) {
    if (visited.has(url)) {
      return;
    }

    if (depth > maxDepth) {
      return;
    }

    visited.add(url);

    let source;

    if (!url.includes("mercatorio")) return;

    try {
      source = await fetchText(url);
    } catch (error) {
      console.warn(
        `[Mercatorio crawler] Failed to fetch ${url}: ${error.message}`,
      );

      return;
    }

    discovered.add(url);

    const childUrls = extractJavaScriptUrls(source, url);

    for (const childUrl of childUrls) {
      await visit(childUrl, depth + 1);
    }
  }

  const html = await fetchText(websiteUrl);

  const scripts = extractScriptUrls(html, websiteUrl);

  for (const script of scripts) {
    await visit(script, 0);
  }

  return {
    html,
    scripts,
    assets: [...discovered],
  };
}

/**
 * Download all discovered JS assets.
 */
async function downloadAssets(assets, outputDirectory) {
  ensureDirectory(outputDirectory);

  const downloaded = [];


  for (const url of assets.assets) {
    const filename = getSafeFilename(url);
    const outputPath = path.join(outputDirectory, filename);

    try {
      const source = await fetchText(url);

      fs.writeFileSync(outputPath, source, "utf8");

      downloaded.push({
        url,
        filename,
        path: outputPath,
        size: Buffer.byteLength(source, "utf8"),
      });

      console.log(
        `[Mercatorio crawler] Downloaded ${filename} (${Buffer.byteLength(
          source,
          "utf8",
        )} bytes)`,
      );
    } catch (error) {
      console.warn(
        `[Mercatorio crawler] Failed to download ${url}: ${error.message}`,
      );
    }
  }

  return downloaded;
}

module.exports = {
  WEBSITE_URL,
  ensureDirectory,
  fetchText,
  extractScriptUrls,
  extractJavaScriptUrls,
  discoverJavaScriptAssets,
  downloadAssets,
};
