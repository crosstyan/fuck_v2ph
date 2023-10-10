import { random } from "lodash"
import { handle_images, get_navigation, get_images_links } from "./handle"
import { bothLog, addUrl } from "./exposed";

(async () => {
  if (document != undefined) {
    /** @type {Set<string>} */
    const uris = new Set();

    (async () => {
      const primary_list = document.getElementsByClassName("photos-list")[0]
      if (primary_list == undefined) {
        console.warn("no primary list")
        return
      }
      const pages = get_navigation()
      for (let page of pages) {
        const resp = await fetch(page)
        const text = await resp.text()
        const parser = new DOMParser()
        // https://github.com/tuupola/lazyload
        // https://github.com/tuupola/lazyload/blob/d3ad81c12332a0f950c6c703ff975b60350405a4/lazyload.js#L113
        // This is how lazyload works: trigger a non fetch (CORS) so
        // [Sec-Fetch-Dest: image] and [Sec-Fetch-Mode: no-cors] are set
        // (secured headers field)
        const dom = parser.parseFromString(text, "text/html")
        const photo_list = dom.querySelectorAll(".photos-list")[0]
        if (photo_list == undefined) {
          console.warn(`no photos-list in ${page.toString()}`)
          continue
        }
        const imgs = photo_list.querySelectorAll("img")
        const image_links = get_images_links(imgs)
        image_links.forEach((link) => { 
          uris.add(link)
          addUrl(link)
        })
        const sleep_ms = random(300, 1000)
        bothLog(`[${page}] sleeping ${sleep_ms}ms`)
        bothLog(`[${page}] ${image_links.length} images`)
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, sleep_ms)
        })
      }
      // const l = Array.from(uris)
      // bothLog(l)
    })()
  }
})()
