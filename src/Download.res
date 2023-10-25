// https://rescript-lang.org/blog/improving-interop#decoding-and-encoding-json-idiomatically

module Request = {
  type t = {
    url: string,
    headers: Belt.Map.String.t<string>,
    out_prefix: string,
    cookies: array<Cookie.t>,
  }
  let {object_, string, number, boolean, array, objectArray, null} = module(Js.Json)
  let {getWithDefault, isSome} = module(Belt.Option)
  let {toFloat} = module(Belt.Int)
  let {map} = module(Belt.Array)
  let toJson = (r: t) =>
    Js.Dict.fromArray([
      ("url", string(r.url)),
      (
        "headers",
        object_(
          Js.Dict.fromArray(Belt.Map.String.toArray(r.headers)->map(((k, v)) => (k, string(v)))),
        ),
      ),
      ("out_prefix", string(r.out_prefix)),
      ("cookies", array(r.cookies->map(Cookie.toJson))),
    ])

  let unwrap = (opt: option<'a>) =>
    switch opt {
    | Some(x) => x
    | None => failwith("unwrap")
    }

  let fromJson = (json: Js.Json.t): t =>
    switch json {
    | Js.Json.Object(o) =>
      switch (
        o->Js.Dict.get("url"),
        o->Js.Dict.get("headers"),
        o->Js.Dict.get("out_prefix"),
        o->Js.Dict.get("cookies"),
      ) {
      | (Some(url), Some(headers), Some(out_prefix), Some(cookies)) =>
        switch (url, headers, out_prefix, cookies) {
        | (
            Js.Json.String(url),
            Js.Json.Object(headers),
            Js.Json.String(out_prefix),
            Js.Json.Array(cookies),
          ) => {
            let headers =
              headers
              ->Js.Dict.entries
              ->map(tp => {
                let (k, v) = tp
                (k, unwrap(Js.Json.decodeString(v)))
              })
              ->Belt.Map.String.fromArray
            let cookies = cookies->map(c => c -> Cookie.fromJson -> unwrap)
            {url, headers, out_prefix, cookies}
          }
        | _ => failwith("Request.fromJson: invalid json")
        }
      }
    | _ => failwith("Request.fromJson: invalid json")
    }
}

// https://rescript-lang.org/docs/manual/latest/import-export

// https://fullsteak.dev/posts/rescript-json-typed-strongly
// https://github.com/glennsl/rescript-json-combinators
// https://webbureaucrat.gitlab.io/articles/parsing-json-in-rescript-part-i-prerequisites-and-requirements/
// https://github.com/nkrkv/jzon
// https://guide.elm-lang.org/effects/json.html
