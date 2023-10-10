// That's a default export, so you could just name it whatever you want
import vanilla_puppeteer, { HTTPRequest } from "puppeteer"
import { addExtra } from "puppeteer-extra"
import path from "path"
import fs from "fs/promises"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { clone } from "lodash"
import { BehaviorSubject, zip, map, pipe, combineLatestAll, filter, MonoTypeOperatorFunction, scan, reduce, debounce, interval, debounceTime, merge, throttleTime } from "rxjs"
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
    { name: "frontend", value: "0d411d466197bf0d25a37310a4b064cf", domain: "www.v2ph.com", path: "/",  },
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
  // here's how you get a cookie... nice job typescript :(
  type Cookies = Awaited<ReturnType<typeof page.cookies>>
  const requestStream = new BehaviorSubject<HTTPRequest | null>(null)
  const cookiesStream = new BehaviorSubject<Cookies | null>(null)
  const urlStream = new BehaviorSubject<string | null>(null)
  await page.exposeFunction("addUrl", (msg: string) => urlStream.next(msg))

  interface RequestRecord {
    // ISO 8601
    timestamp: string
    cookies: Cookies
    headers: Record<string, string>
  }

  interface PrettyValue {
    cookies: Record<string, string>
    headers: Record<string, string>
  }

  // Key is url
  type PrettyItem = [string, PrettyValue]

  // https://pptr.dev/api/puppeteer.pageevent
  page.on("request", (request) => {
    if (request.resourceType() === "image") {
      // record all image requests
      // now we have the header, we could just emulate the request with other tools
      requestStream.next(request);
      (async () => {
        const cookies = await page.cookies()
        cookiesStream.next(cookies)
      })()
    }
  })

  // a dumb function to make typescript happy...
  // kind of make sense if you consider C++
  // where the compiler would generate different functions for different types
  function mkWhereNotNull<T>(): MonoTypeOperatorFunction<T> {
    return filter((el) => el != undefined)
  }
  const onlyV2ph = filter((req: HTTPRequest) => req.url().includes("v2ph"))
  const onlyPhotosInPath = filter((req: HTTPRequest) => req.url().includes("photos"))

  // https://www.digitalocean.com/community/tutorials/rxjs-operators-forkjoin-zip-combinelatest-withlatestfrom
  // https://gili842.medium.com/rxjs-advance-filter-input-implementation-15bfc90faf9f
  const zipped = zip(requestStream.pipe(mkWhereNotNull(), onlyV2ph, onlyPhotosInPath), cookiesStream.pipe(mkWhereNotNull()))
  const nonNullUrl = urlStream.pipe(mkWhereNotNull())
  const pretty = zipped.pipe(
    map(([request, cookies]) => {
      const cookiesRecord: Record<string, string> = {}
      // since we get our cookies we could serialize them and save them for later use 
      cookies.forEach((cookie) => {
        cookiesRecord[cookie.name] = cookie.value
      })
      const header = request.headers()
      return [request.url(), { cookies: cookiesRecord, headers: header }] as PrettyItem
    }
    ))


  interface LogOutput {
    images: string[]
    requests: Record<string, RequestRecord>
  }

  const initRecord: LogOutput = {
    images: [],
    requests: {}
  }
  const record = merge(zipped, nonNullUrl).pipe(
    scan((acc, item) => {
      const c = clone(acc)
      if (typeof item === "string") {
        c.images.push(item)
      } else {
        const [request, cookies] = item
        const now = new Date()
        c.requests[request.url()] = {
          timestamp: now.toISOString(),
          cookies: cookies,
          headers: request.headers()
        }
      }
      return c
    }, initRecord),
    debounceTime(3000)
  )

  pretty.subscribe((item) => {
    const [url, p] = item
    console.log(url, p)
  })

  nonNullUrl.subscribe((url) => {
    console.log(`[image] ${url}`)
  })

  record.subscribe({
    next: (r) => {
      if (r.images.length === 0 || Object.keys(r.requests).length === 0) {
        console.warn("[record] no image or request filled")
        return
      }
      const now = new Date()
      const fileName = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.log.json`;
      (async () => {
        const p = path.join(__dirname, fileName)
        const file = await fs.open(p, "w")
        await file.write(JSON.stringify(r))
        console.log(`[record] write to ${p}`)
        await file.close()
      })()
    },
    complete: () => console.log("[record] complete"),
    error: (err) => console.error("[record] ", err)
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
