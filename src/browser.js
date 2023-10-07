import { random } from "lodash";
import { imgSrcToBlob } from "blob-util";
import { handle_images, get_navigation, get_images_links } from "./handle"

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
        const photo_lists = dom.querySelectorAll(".photos-list")[0]
        if (photo_lists == undefined) {
          console.warn(`no photos-list in ${page.toString()}`)
          continue
        }
        primary_list.insertAdjacentElement("afterend", photo_lists)
        const sleep_ms = random(300, 1000)
        console.log(`sleeping ${sleep_ms}ms`)
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, sleep_ms)
        })
      }
      const lists = document.getElementsByClassName("photos-list")
      for (let list of lists) {
        const imgs = list.querySelectorAll("img")
        const image_links = get_images_links(imgs)
        uris.add(...image_links)
      }
      console.log(`total ${uris.size} images`)
      const l = Array.from(uris)
      const resp = await imgSrcToBlob(l[0], "image/jpeg", "anonymous")
      console.log(resp)
    })()
  }
})()
