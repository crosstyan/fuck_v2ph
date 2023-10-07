// That's a default export, so you could just name it whatever you want
import vanilla_puppeteer from "puppeteer"
import { addExtra } from "puppeteer-extra"
import path from "path"
import fs from "fs/promises"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

// https://www.zenrows.com/blog/puppeteer-avoid-detection
// https://www.zenrows.com/blog/puppeteer-stealth
// https://www.zenrows.com/blog/puppeteer-cloudflare-bypass

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
const puppeteer = addExtra(vanilla_puppeteer)
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setUserAgent(UA)
  // three cookies pairs
  await page.setCookie(
    { name: "frontend-rmt", value: "QJXOu5EprRK52J2%2BpjqGycmk4QDZCGZZUNkiYE%2FHgO1C%2BqkCyvaRFSbBIpjrb7%2Bt", domain: "www.v2ph.com", path: "/" },
    { name: "frontend-rmu", value: "cLTfhhL9yAZK0NhBf9%2BoJd4dU52w4A%3D%3D", domain: "www.v2ph.com", path: "/" },
    { name: "frontend", value: "d0a408e2963bc250dad8781429015fd5", domain: "www.v2ph.com", path: "/" },
  )
  await page.setExtraHTTPHeaders({
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ja-JP,ja;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.6,en;q=0.5",
    "User-Agent": UA,
    "Sec-Ch-Ua": `"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"`,
    "Sec-Ch-Ua-Platform": "Windows",
  })
  await page.setViewport({ width: 1280, height: 960 })

  await page.goto("https://www.v2ph.com/album/ae35963a.html", { waitUntil: "domcontentloaded" })
  // https://github.com/puppeteer/puppeteer/issues/3570
  // https://github.com/puppeteer/puppeteer/issues/985
  const build_path = path.join(__dirname, "..", "build", "dist")
  // load browser.js, which is built by esbuild
  // see [package.json] scripts["build"]
  // just inline the source map
  const browser_js_path = path.join(build_path, "browser.js")
  const stat = await fs.stat(browser_js_path)
  if (stat.isFile()) {
    await page.addScriptTag({ path: browser_js_path })
  } else {
    console.log("browser.js not found")
  }
  // await browser.close();
})()
