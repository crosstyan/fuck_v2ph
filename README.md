```bash
pnpm install
# run in background to build static files
pnpm run watch:all
pnpm run start -- --cookies cookies.log.json --url https://www.v2ph.com/album/am4o344z.html
```

Of course you need Chrome installed.

> [!IMPORTANT] as for 2024/06/16, [Cloudflare](https://www.cloudflare.com/) could block
request from [Puppeteer](https://pptr.dev/) to prevent scraping. [Attaching puppeteer to existing chrome](https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0) might be an alternative solution, but I'm too lazy to do that. The current implementation can't bypass the login page, so you can only
scrap the first page of the album.
