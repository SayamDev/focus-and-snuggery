import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Plant } from "@phosphor-icons/react";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const mark = renderToStaticMarkup(
  React.createElement(Plant, { size: 320, weight: "fill", color: "#46644f" }),
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#f7f8f2"/><g transform="translate(96 96)">${mark}</g></svg>`;
await writeFile("public/icon.svg", svg);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`,
  );
  await page.screenshot({ path: `public/icon-${size}.png` });
}
await browser.close();
