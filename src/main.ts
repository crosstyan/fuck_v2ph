// That's a default export, so you could just name it whatever you want
import vanilla_puppeteer, { HTTPRequest } from "puppeteer"
import { addExtra } from "puppeteer-extra"
import path from "path"
import fs from "fs/promises"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { clone } from "lodash"
import { BehaviorSubject, zip, map, pipe, combineLatestAll, filter, MonoTypeOperatorFunction, scan, reduce, debounce, interval, debounceTime, merge, throttleTime } from "rxjs"
import repl from "node:repl"
import { program } from "commander"
import { Protocol } from 'devtools-protocol'

// https://www.zenrows.com/blog/puppeteer-avoid-detection
// https://www.zenrows.com/blog/puppeteer-stealth
// https://www.zenrows.com/blog/puppeteer-cloudflare-bypass

// https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie
type Cookies = Protocol.Network.Cookie[]

const default_cookies_path = "cookies.log.json"
program.name("dumb-crawler").description("a dumb crawler for v2ph.com")
program.option("-c, --cookies <file>", "a file path to load cookies from", default_cookies_path)
program.option("-u, --url <url>", "a url to load")
program.parse()

const opts = program.opts()
let cookies_path: string = opts.cookies
if (cookies_path === default_cookies_path) {
  console.log(`cookies path not specified, use default: ${default_cookies_path}`)
} else {
  if (typeof cookies_path !== "string") {
    console.error(`cookies path should be a string. get ${cookies_path} (${typeof cookies_path})`)
    process.exit(1)
  }
  console.log(`using cookies path: ${cookies_path}`)
}

let target_url : URL | null = null
if (opts.url == undefined) {
  console.error("url not specified")
  process.exit(1)
} else {
  if (typeof opts.url !== "string") {
    console.error(`url should be a string. get ${opts.url} (${typeof opts.url})`)
    process.exit(1)
  }
  target_url = new URL(opts.url)
  if (!target_url.hostname.includes("v2ph.com")) {
    console.error(`url should be a v2ph.com url. get ${target_url}`)
    process.exit(1)
  }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
const puppeteer = addExtra(vanilla_puppeteer)
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setUserAgent(UA)
  let isFile = false
  try {
    isFile = (await fs.stat(cookies_path)).isFile()
  } catch { isFile = false }
  if (isFile) {
    try {
      const raw_cookies = await fs.readFile(cookies_path, { encoding: "utf-8" })
      const cookies = JSON.parse(raw_cookies) as Protocol.Network.Cookie[]
      if (!Array.isArray(cookies)) {
        console.error("cookies should be an array")
      }
      const cookies_record: Record<string, string> = {}
      cookies.forEach((cookie) => { cookies_record[cookie.name] = cookie.value })
      console.log("loaded cookies", cookies_record)
      await page.setCookie(...cookies)
    } catch (err) {
      console.error(err)
    }
  } else {
    console.warn("cookies not found. skip loading cookies.")
  }

  await page.setExtraHTTPHeaders({
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ja-JP,ja;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.6,en;q=0.5",
  })
  await page.setViewport({ width: 1280, height: 960 })

  // https://github.com/puppeteer/puppeteer/issues/2331
  // https://pptr.dev/api/puppeteer.page.exposefunction
  // https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
  // https://stackoverflow.com/questions/11580961/sending-command-line-arguments-to-npm-script
  await page.exposeFunction("customLog", (msg: string) => console.log(msg))

  /**
   * @description Save cookies to a file
   * 
   * @param cookie_path path to save cookies. if not specified, save to `cookies.log.json` in current working directory
   */
  const saveCookies = (cookie_path: string = null) => {
    if (cookie_path == undefined) {
      const cwd = process.cwd()
      cookie_path = path.join(cwd, "cookies.log.json")
    }
    const p = new Promise<Cookies>(async (resolve, reject) => {
      const cookies = await page.cookies()
      console.log(`cookies save to ${cookie_path}`)
      await fs.writeFile(cookie_path, JSON.stringify(cookies))
      resolve(cookies)
    })
    return p
  }

  const printCookies = () => {
    const p = new Promise<Cookies>(async (resolve, reject) => {
      const cookies = await page.cookies()
      resolve(cookies)
    })
    return p
  }
  await page.exposeFunction("saveCookies", saveCookies)
  await page.exposeFunction("printCookies", printCookies)
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
        const pwd = process.cwd()
        const p = path.join(pwd, fileName)
        const file = await fs.open(p, "w")
        await file.write(JSON.stringify(r))
        console.log(`[record] write to ${p}`)
        await file.close()
        await saveCookies()
      })()
    },
    complete: () => console.log("[record] complete"),
    error: (err) => console.error("[record] ", err)
  })

  const loaded = page.goto(target_url.toString(), { waitUntil: "domcontentloaded" })
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
    console.log(`load browser.js from ${browser_js_path}`)
    await loaded.then(() => page.addScriptTag({ path: browser_js_path }))
  } else {
    console.log("browser.js not found")
  }
  const server = repl.start("> ")
  server.context.puppeteer = puppeteer
  server.context.browser = browser
  server.context.page = page
  server.context.saveCookies = saveCookies
})()
