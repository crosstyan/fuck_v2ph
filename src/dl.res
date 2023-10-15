module Download = {
  module Cookie = {
    // https://rescript-lang.org/docs/manual/latest/polymorphic-variant
    // https://rescript-lang.org/syntax-lookup
    // https://practicalrescript.com/making-the-rescript-type-system-work-for-you-part-i/
    // https://practicalrescript.com/making-the-rescript-type-system-work-for-you-part-ii/
    // https://mdxjs.com/
    // https://atd.readthedocs.io/en/latest/atd-language.html
    // https://dev.realworldocaml.org/json.html
    // https://rescript-lang.org/docs/manual/latest/build-external-stdlib
    type cookieSameSite = [#Strict | #Lax | #None]
    type cookiePriority = [#Low | #Medium | #High]
    type cookieSourceScheme = [#Unset | #NonSecure | #Secure]
    type t = {
      /* Cookie name. */
      name: string,
      /* Cookie value. */
      value: string,
      /* Cookie domain. */
      domain: string,
      /* Cookie path. */
      path: string,
      /* Cookie expiration date as the number of seconds since the UNIX epoch. */
      expires: int,
      /* Cookie size. */
      size: int,
      /* True if cookie is http-only. */
      httpOnly: bool,
      /* True if cookie is secure. */
      secure: bool,
      /* True in case of session cookie. */
      session: bool,
      /* Cookie SameSite type. */
      sameSite: option<cookieSameSite>,
      /* Cookie Priority */
      priority: cookiePriority,
      /* True if cookie is SameParty. */
      sameParty: bool,
      /* Cookie source scheme type. */
      sourceScheme: cookieSourceScheme,
      /* Cookie source port. Valid values are {-1, [1, 65535]}, -1 indicates an unspecified port.
       * An unspecified port value allows protocol clients to emulate legacy cookie scope for the port.
       * This is a temporary ability and it will be removed in the future. */
      sourcePort: int,
      /* Cookie partition key. The site of the top-level URL the browser was visiting at the start
       * of the request to the endpoint that set the cookie. */
      partitionKey: option<string>,
      /* True if cookie partition key is opaque. */
      partitionKeyOpaque: option<bool>,
    }
    // TODO: encoder
    // https://rescript-json.jaredramirez.omg.lol/
    // Why don't we use decorator?
  }

  module Request = {
    type t = {
      url: string,
      // Belt.Map.String.t<string>
      headers: Js.Dict.t<string>,
      out_prefix: string,
      cookies: array<Cookie.t>,
    }
  }

  // https://fullsteak.dev/posts/rescript-json-typed-strongly
  // https://github.com/glennsl/rescript-json-combinators
  // https://webbureaucrat.gitlab.io/articles/parsing-json-in-rescript-part-i-prerequisites-and-requirements/
  // https://github.com/nkrkv/jzon
  // https://guide.elm-lang.org/effects/json.html
  let asyncSend = async (r: request) => {
    Fetch.fetch(
      r.url,
      {
        body: Js.Json.stringify(r),
      },
    )
  }
}
