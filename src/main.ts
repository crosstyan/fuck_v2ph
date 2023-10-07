import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.v2ph.com/album/ae35963a.html");

  // await browser.close();
})()
