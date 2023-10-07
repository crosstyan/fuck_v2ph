// ==UserScript==
// @name         Fuck v2ph
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Crosstyan
// @match        https://www.v2ph.com/album/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 * @description Scroll to every image link to trick the script to load image from CDN
 * 
 * @param {Element[] | NodeListOf<Element>} imgs 
 * @param {Set<string>} uris
 */
async function handle_images(imgs, uris) {
  for (let img of imgs) {
    /** @type {string} */
    let src = img.attributes["src"]
    /** @type {string} */
    const data_src = img.attributes["data-src"]
    // https://stackoverflow.com/questions/41424989/javascript-listen-for-attribute-change
    if (typeof src !== "string") {
      src = src.textContent
    }
    if (src.startsWith("data:image/gif;")) {
      console.log(`resolving ${src}`)
      /** @type {Promise<MutationObserver>} */
      const finished = new Promise((resolve, reject) => {
        img.scrollIntoView(false)
        const observer = new MutationObserver((muts) => {
          let src = img.attributes["src"]
          if (typeof src !== "string") {
            src = src.textContent
          }
          console.log(`changed into ${src}`)
          uris.add(src)
          resolve(observer)
        })
        observer.observe(img, { attributes: true })
      })
      const obs = await finished
      obs.disconnect()
    } else {
      console.log(`loaded ${src}`)
      uris.add(src)
    }
  }
}

/**
 * @description scroll to bottom for a given time to trick infinite scroll
 * 
 * @param {number} time time in milliseconds
 * @param {number} interval interval in milliseconds, should be less than time
 */
async function force_to_bottom(time, interval) {
  /** @type {Promise<void>} */
  const ret = new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, interval)
    setTimeout(() => {
      clearInterval(handle)
      resolve()
    }, time)
  })
  return ret
}

/**
 * @param {(e: MouseEvent) => void} onclick
 */
function create_button(onclick) {
  const first = document.querySelectorAll(".card .card-body")[0]
  const btn = document.createElement("button")
  btn.textContent = "Download"
  btn.onclick = onclick
  first.appendChild(btn)
}

// https://github.com/Tampermonkey/tampermonkey/issues/1113
// https://www.tampermonkey.net/documentation.php?locale=en
// https://gist.github.com/ccloli/832a8350b822f3ff5094
async function main() {
  const uris = new Set()
  create_button(async () => {
    await force_to_bottom(5000, 100)
    // https://github.com/hoothin/UserScripts/blob/master/Pagetual/pagetual.user.js
    const lists = document.getElementsByClassName("photos-list")
    for (let list of lists) {
      const imgs = list.querySelectorAll("img")
      await handle_images(imgs, uris)
    }
    for (let uri of uris) {
      const name = uri.split("/").pop()
      console.log(`try to download ${uri} as ${name}`)
      GM_download({
        url: uri,
        name: name,
        onload: () => {
          console.log(`downloaded ${uri} as ${name}`)
        },
        onerror: (err) => {
          console.error(`failed to download ${uri}; error: ${err.error}; details: ${err.details}`)
        },
        conflictAction: "overwrite",
      })
    }
  })
}


(function () {
  'use strict'
  main()
})()

export { handle_images }
