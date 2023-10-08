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

export { terminalLog, bothLog }
