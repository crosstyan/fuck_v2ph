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

import { range, clone } from "lodash"

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

/**
 * @description get all page links
 * 
 * @returns {URL[]}
 */
function get_navigation() {
  const nav = document.querySelectorAll("nav .page-link")
  // no idea why capital A
  /** @type {HTMLAnchorElement[]} */
  const linkElems = Array.of(...nav).filter((e) => e.tagName.toLowerCase() === "a")
  const links = linkElems.map((e) => new URL(e.href))
  /** @type {number[]} */
  const pages = []
  if (links.length === 0) {
    return []
  }
  for (const link of links) {
    if (link.searchParams.has("page")) {
      pages.push(parseInt(link.searchParams.get("page")))
    }
  }
  if (pages.length === 0) {
    return []
  }
  const first = links[0]
  const baseUrl = `${first.origin}${first.pathname}`
  const maxPage = Math.max(...pages)
  const pageNumbers = range(1, maxPage + 1)
  const pageLinks = pageNumbers.map((n) => new URL(`${baseUrl}?page=${n}`))
  return pageLinks
}

export { handle_images, get_navigation }
