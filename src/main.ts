// That's a default export, so you could just name it whatever you want
import vanilla_puppeteer from "puppeteer"
import { addExtra } from "puppeteer-extra"
import path from "path"
import fs from "fs/promises"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import repl from "node:repl"

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
  await page.setCookie(
    { name: "frontend-rmt", value: "QJXOu5EprRK52J2%2BpjqGycmk4QDZCGZZUNkiYE%2FHgO1C%2BqkCyvaRFSbBIpjrb7%2Bt", domain: "www.v2ph.com", path: "/" },
    { name: "frontend-rmu", value: "cLTfhhL9yAZK0NhBf9%2BoJd4dU52w4A%3D%3D", domain: "www.v2ph.com", path: "/" },
    // should be refreshed every session... but how to get it?
    // Cookies that 'expire at end of the session' expire unpredictably from the user's perspective!
    { name: "frontend", value: "ab5026e08e6333893a0e5c5bc20b5172", domain: "www.v2ph.com", path: "/" },
  )
  await page.setExtraHTTPHeaders({
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ja-JP,ja;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.6,en;q=0.5",
  })
  await page.setViewport({ width: 1280, height: 960 })

  // https://github.com/puppeteer/puppeteer/issues/2331
  // https://pptr.dev/api/puppeteer.page.exposefunction
  // https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
  await page.exposeFunction("customLog", (msg: string) => console.log(msg))
  // https://pptr.dev/api/puppeteer.pageevent
  page.on("request", (request) => {
    if (request.resourceType() === "image") {
      // record all image requests
      const header = request.headers()
      console.log(request.url(), header);
      (async ()=>{
        const cookies = await page.cookies()
        /** @type {Record<string, string>} */
        const cookiesRecord = {}
        // since we get our cookies we could serialize them and save them for later use 
        cookies.forEach((cookie) => {
          cookiesRecord[cookie.name] = cookie.value
        })
        console.log(request.url(), cookiesRecord)
      })()
      // now we have the header, we could just emulate the request with other tools
    }
  })

  const loaded = page.goto("https://www.v2ph.com/album/ae35963a.html", { waitUntil: "domcontentloaded" })
  // https://github.com/puppeteer/puppeteer/issues/3570
  // https://github.com/puppeteer/puppeteer/issues/985
  const build_path = path.join(__dirname, "..", "build", "dist")
  // load browser.js, which is built by esbuild
  // see [package.json] scripts["build"]
  // just inline the source map
  const browser_js_path = path.join(build_path, "browser.js")
  const stat = await fs.stat(browser_js_path)
  if (stat.isFile()) {
    // honestly I prefer to use this instead of page.evaluate
    await loaded.then(() => page.addScriptTag({ path: browser_js_path }))
  } else {
    console.log("browser.js not found")
  }
  const server = repl.start("> ")
  server.context.puppeteer = puppeteer
  server.context.browser = browser
  server.context.page = page
})()
