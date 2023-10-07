import { handle_images } from "./handle"


(async ()=>{
  if (document != undefined) {
    /** @type {Set<string>} */
    const uris = new Set();

    (async () => {
      const lists = document.getElementsByClassName("photos-list")
      for (let list of lists) {
        const imgs = list.querySelectorAll("img")
        await handle_images(imgs, uris)
      }
    })()
  }
})()
