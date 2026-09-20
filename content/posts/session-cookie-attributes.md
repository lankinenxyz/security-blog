---
title: "Session Cookies: The Four Attributes That Matter"
description: "HttpOnly, Secure, SameSite and the host prefix do most of the work of session security. What each one actually blocks, and where each one stops."
date: 2026-06-24
tags: ["Web Security", "Sessions", "Cookies"]
author: "Elias Lankinen"
---

Session handling is where a lot of otherwise careful applications quietly give up. The framework sets a cookie, it works, and nobody reads the `Set-Cookie` line again. It is worth reading, because four attributes on that line decide how much of your authentication survives a bad day.

Here is the line you want:

```http
Set-Cookie: __Host-session=<opaque-id>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```

## HttpOnly: survives XSS, sort of

`HttpOnly` makes the cookie invisible to `document.cookie`. If an attacker lands script on your page, they cannot read the session id and post it to their server.

What it does not do is stop that script from *using* the session. The cookie still rides along on every same-origin `fetch` the injected script makes. An attacker with XSS on your origin does not need to steal the session; they can just act as the user from inside the page.

So `HttpOnly` converts "permanent session theft" into "control for as long as the tab is open". That is a real downgrade in severity, and it is not a reason to be relaxed about XSS.

## Secure: not just for the cookie

`Secure` stops the cookie being sent over plain HTTP. Obvious, and still occasionally missing on an internal admin panel someone was "going to put behind TLS later".

The subtlety is that HTTP and HTTPS share a cookie jar. Without `Secure`, an attacker who can intercept any plaintext request to *any* subdomain can not only read the cookie but overwrite it. Cookie-forcing attacks like that are the reason session fixation keeps coming back from the dead.

## SameSite: the CSRF control that is almost enough

`SameSite` decides whether the cookie is attached to requests that originate from another site.

- **`Strict`** — never sent cross-site. Strongest, and it means a user following a link from their email into your app arrives logged out. Fine for a banking dashboard, bad for a content site.
- **`Lax`** — sent on top-level navigations that use a safe method. Blocks the classic auto-submitting `POST` form attack while keeping inbound links working. This is the right default, and now the browser default when the attribute is absent.
- **`None`** — always sent, requires `Secure`. Only for cookies that genuinely need to work inside a third-party frame.

`Lax` is not a complete CSRF defence. It does nothing against an attacker on a subdomain of your own site, and a `GET` request that changes state is still reachable from a cross-site navigation. Keep the anti-CSRF token, and keep state-changing operations off `GET`.

## __Host-: the attribute that is not an attribute

`__Host-` is a prefix on the cookie *name*, and browsers enforce rules on any cookie that carries it. To be accepted it must be `Secure`, have `Path=/`, and have **no `Domain` attribute**.

That last rule is the point. Without it, `evil.yourcompany.com` — a forgotten marketing subdomain, a customer-controlled CNAME, a staging box — can set a cookie with `Domain=yourcompany.com` that your application reads as its own session. The prefix makes the cookie host-locked in a way the browser will enforce for you, for the cost of renaming it.

## What the attributes do not cover

Cookie flags are transport hardening. They say nothing about the session itself, and these are the parts that get skipped:

- **Rotate the id on privilege change.** New session id on login, and on any step-up to admin. This is the actual fix for session fixation.
- **Make the id opaque and random.** 128 bits from a CSPRNG, stored server-side. A signed JWT in a cookie is not a session, because you cannot revoke it.
- **Expire on two clocks.** An idle timeout and an absolute lifetime. Without the absolute one, an attacker with a stolen session keeps it alive indefinitely by poking it.
- **Invalidate server-side on logout.** Clearing the cookie logs out the honest user and nobody else.

Get the four attributes right in the framework config once. Then spend your time on rotation and revocation, which is where real session attacks are actually won or lost.
