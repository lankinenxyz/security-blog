---
title: "A Content Security Policy That Actually Holds"
description: "Most CSP headers in production are bypassable in a single line. Here is why unsafe-inline and host allowlists fail, and how nonces and strict-dynamic fix them."
date: 2026-08-19
updated: 2026-09-02
tags: ["Web Security", "Headers", "XSS"]
author: "Elias Lankinen"
---

Content Security Policy is the most misconfigured security header on the web. Not because it is hard to enable, but because the configuration everyone copies is the one that does nothing.

If your policy contains `'unsafe-inline'` in `script-src`, you do not have XSS mitigation. You have a header.

## Why host allowlists fail

The classic policy looks like this:

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com https://www.google-analytics.com
```

The intent is "only run scripts from places we trust". The problem is what lives on those hosts. A CDN that serves any published package, or an analytics host with a JSONP endpoint, turns into an arbitrary-script source. Google's own research found that the large majority of real-world allowlist policies were bypassable, usually through one forgotten origin.

An allowlist is a list of origins you have audited for script gadgets, forever, including every file anyone ever uploads to them. Nobody is doing that.

## The policy that works

Generate a fresh random nonce per response, put it on your own script tags, and let `strict-dynamic` handle the loaders:

```http
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  require-trusted-types-for 'script'
```

Reading that from the top:

- **`'nonce-{RANDOM}'`** — only script tags carrying today's nonce execute. Injected markup cannot guess it.
- **`'strict-dynamic'`** — a script that already ran can load more scripts. This is what lets a bundler or tag manager keep working without you allowlisting every origin it reaches for.
- **`https:` and `'unsafe-inline'`** — pure backwards compatibility. Browsers that understand `strict-dynamic` ignore both; browsers that do not fall back to something rather than nothing.
- **`object-src 'none'`** — kills the plugin-based bypasses.
- **`base-uri 'none'`** — stops an injected `<base>` tag from repointing every relative script URL at an attacker.

The last two lines are not optional garnish. A policy with a perfect `script-src` and no `base-uri` is bypassable with one injected tag.

## Generating the nonce

The nonce must be unpredictable and unique per response. 128 bits from a CSPRNG, base64-encoded:

```ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
```

Three rules that are easy to get wrong:

1. **Never reuse a nonce across responses.** A cached nonce is a public nonce. This is the reason a nonce-based policy and a fully static, CDN-cached HTML page do not mix; use hashes there instead.
2. **Never derive it from request data.** If it is a hash of the URL or the session id, it is guessable.
3. **Never put it anywhere but the header and the tag.** A nonce echoed into a DOM attribute an attacker can read is gone.

## Roll it out in report-only

Ship `Content-Security-Policy-Report-Only` with a `report-to` endpoint first. Run it for a couple of weeks, read the reports, and expect three categories:

- **Real violations** — you found inline handlers you did not know about. Fix them.
- **Browser extension noise** — filter it out; you cannot fix it and it will drown the signal.
- **Your own analytics snippet** — the vendor almost always has a nonce-compatible install. Ask.

Only after the real-violation bucket is empty do you flip the header name. Enforcing a policy you have not measured is how you take down checkout on a Friday.

## Trusted Types are the actual finish line

`require-trusted-types-for 'script'` moves the browser from "block this injection" to "make the dangerous sink uncallable with a plain string". `element.innerHTML = userInput` stops being a thing that compiles, anywhere in your codebase, forever.

It is a real migration, and it is the only control on this list that turns DOM XSS from a class of bug you keep finding into a class of bug you cannot write.
