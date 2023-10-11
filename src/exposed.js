/** 
 * @description Exposed nodejs log function from puppeteer
 * 
 * @type {(message?: any, ...optionalParams: any[]) => Promise<void>} 
 * */
const terminalLog = (window.customLog != undefined) ? window.customLog : undefined


/**
 * @description Log to both nodejs and browser, if nodejs is available
 * 
 * @type {(message?: any, ...optionalParams: any[]) => void} 
 */
const bothLog = (message, ...optionalParams) => {
  console.log(message, ...optionalParams)
  if (terminalLog != undefined) {
    terminalLog(message, ...optionalParams)
  }
}

/**
 * @description Add url to the list of urls to be downloaded
 * 
 * @type {(url: string) => Promise<void>} 
 */
const addUrl = (window.addUrl != undefined) ? window.addUrl : undefined

/**
 * @description Save cookie to be used in the browser
 * 
 * @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie
 * @type {() => Promise<Protocol.Network.Cookie[]>} 
 */
const saveCookies = (window.saveCookies != undefined) ? window.saveCookies : undefined

/**
 * @description Print cookie to be used in the browser in NodeJS
 * 
 * @type {() => Promise<Protocol.Network.Cookie[]>} 
 */
const printCookies = (window.printCookies != undefined) ? window.printCookies : undefined

export { terminalLog, bothLog, addUrl, saveCookies }
