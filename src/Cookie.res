// https://rescript-lang.org/docs/manual/latest/polymorphic-variant
// https://rescript-lang.org/syntax-lookup
// https://practicalrescript.com/making-the-rescript-type-system-work-for-you-part-i/
// https://practicalrescript.com/making-the-rescript-type-system-work-for-you-part-ii/
// https://mdxjs.com/
// https://atd.readthedocs.io/en/latest/atd-language.html
// https://dev.realworldocaml.org/json.html
// https://rescript-lang.org/docs/manual/latest/build-external-stdlib
let {object_, string, number, boolean, array, objectArray, null} = module(Js.Json)
let {getWithDefault, isSome} = module(Belt.Option)
let {toFloat} = module(Belt.Int)

let unwrap = (opt: option<'a>) =>
  switch opt {
  | Some(x) => x
  | None => failwith("unwrap")
  }

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
// https://rescript-lang.org/blog/improving-interop#decoding-and-encoding-json-idiomatically
// https://github.com/rescript-lang/rescript-compiler/blob/master/jscomp/others/js_json.res
// https://rescript-lang.org/syntax-lookup#type-coercion
// Why don't we use decorator?
let toJson = (cookie: t) =>
  object_(
    Js.Dict.fromArray([
      ("name", string(cookie.name)),
      ("value", string(cookie.value)),
      ("domain", string(cookie.domain)),
      ("path", string(cookie.path)),
      ("expires", number(toFloat(cookie.expires))),
      ("size", number(toFloat(cookie.size))),
      ("httpOnly", boolean(cookie.httpOnly)),
      ("secure", boolean(cookie.secure)),
      ("session", boolean(cookie.session)),
      ("sameSite", isSome(cookie.sameSite) ? string((unwrap(cookie.sameSite) :> string)) : null),
      ("priority", string((cookie.priority :> string))),
      ("sameParty", boolean(cookie.sameParty)),
      ("sourceScheme", string((cookie.sourceScheme :> string))),
      ("sourcePort", number(toFloat(cookie.sourcePort))),
      (
        "partitionKey",
        isSome(cookie.partitionKey) ? string((unwrap(cookie.partitionKey) :> string)) : null,
      ),
      (
        "partitionKeyOpaque",
        isSome(cookie.partitionKeyOpaque) ? boolean(unwrap(cookie.partitionKeyOpaque)) : null,
      ),
    ]),
  )

let fromJson = (json: Js.Json.t): option<t> =>
  switch json {
  | Js.Json.Object(dict) =>
    switch (
      dict->Js.Dict.get("name"),
      dict->Js.Dict.get("value"),
      dict->Js.Dict.get("domain"),
      dict->Js.Dict.get("path"),
      dict->Js.Dict.get("expires"),
      dict->Js.Dict.get("size"),
      dict->Js.Dict.get("httpOnly"),
      dict->Js.Dict.get("secure"),
      dict->Js.Dict.get("session"),
      dict->Js.Dict.get("sameSite"),
      dict->Js.Dict.get("priority"),
      dict->Js.Dict.get("sameParty"),
      dict->Js.Dict.get("sourceScheme"),
      dict->Js.Dict.get("sourcePort"),
      dict->Js.Dict.get("partitionKey"),
      dict->Js.Dict.get("partitionKeyOpaque"),
    ) {
    | (
        Some(String(name)),
        Some(String(value)),
        Some(String(domain)),
        Some(String(path)),
        Some(Number(expires)),
        Some(Number(size)),
        Some(Boolean(httpOnly)),
        Some(Boolean(secure)),
        Some(Boolean(session)),
        sameSite,
        Some(String(priority)),
        Some(Boolean(sameParty)),
        Some(String(sourceScheme)),
        Some(Number(sourcePort)),
        partitionKey,
        partitionKeyOpaque,
      ) =>
      Some({
        name,
        value,
        domain,
        path,
        expires: int_of_float(expires),
        size: int_of_float(size),
        httpOnly,
        secure,
        session,
        sameSite: switch sameSite {
        | Some(String(site)) =>
          Some(
            switch site {
            | "Strict" => #Strict
            | "Lax" => #Lax
            | "None" => #None
            | _ => failwith("sameSite")
            },
          )
        | None => None
        },
        priority: switch priority {
        | "Low" => #Low
        | "Medium" => #Medium
        | "High" => #High
        | _ => failwith("priority")
        },
        sameParty,
        sourceScheme: switch sourceScheme {
        | "Unset" => #Unset
        | "NonSecure" => #NonSecure
        | "Secure" => #Secure
        | _ => failwith("sourceScheme")
        },
        sourcePort: int_of_float(sourcePort),
        partitionKey: switch partitionKey {
        | Some(String(key)) => Some(key)
        | None => None
        },
        partitionKeyOpaque: switch partitionKeyOpaque {
        | Some(Boolean(opaque)) => Some(opaque)
        | None => None
        },
      })
    }
  | _ => None
  }
