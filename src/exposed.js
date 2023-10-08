/** 
 * @description Exposed nodejs log function from puppeteer
 * 
 * @type {(message?: any, ...optionalParams: any[]) => void | undefined} 
 * */
const terminalLog = (window.customLog != undefined) ? window.customLog : undefined


/**
 * @description Log to both nodejs and browser, if nodejs is available
 * 
 * @type {(message?: any, ...optionalParams: any[]) => void | undefined} 
 */
const bothLog = (message, ...optionalParams) => {
  console.log(message, ...optionalParams)
  if (terminalLog != undefined) {
    terminalLog(message, ...optionalParams)
  }
}

export { terminalLog, bothLog }
