import { Protocol } from 'devtools-protocol'
export namespace Download {
  /**
   * @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie
   */
  type Cookie = Protocol.Network.Cookie

  type Request = {
    url: string;
    headers: Record<string, string>;
    out_prefix: string;
    cookies: Cookie[];
  }
}