import { handle_images, get_navigation } from "./handle"

(async ()=>{
  if (document != undefined) {
    /** @type {Set<string>} */
    const uris = new Set();

    (async () => {
      const pages = get_navigation()
      for (let page of pages) {

      }
      // const lists = document.getElementsByClassName("photos-list")
      // for (let list of lists) {
      //   const imgs = list.querySelectorAll("img")
      //   await handle_images(imgs, uris)
      // }
    })()
  }
})()
