import { random } from "lodash";
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
      const resp = await fetch(uris.values().next().value)
      console.log(resp)
    })()
  }
})()
