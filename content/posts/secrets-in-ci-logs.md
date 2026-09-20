---
title: "Your CI Logs Are Leaking Secrets"
description: "Masking hides secrets from the build log, not from the build. A look at where credentials actually escape in CI, and the controls that stop it."
date: 2026-07-30
tags: ["CI/CD", "Secrets", "Supply Chain"]
author: "Elias Lankinen"
---

Every CI provider offers secret masking: put a value in the encrypted settings, and the runner replaces it with `***` on its way to the log. It is a genuinely useful feature and it creates a dangerous impression, which is that the secret is now contained.

It is not contained. It is in the environment of every process the job starts.

## What masking does and does not cover

Masking is a string replacement on log output. It covers the exact bytes of the secret. It does not cover:

- **Transformations.** Base64-encode it, URL-encode it, print it one character per line, and the masker sees a string it has never been told about.
- **Anything not going through the log.** Artifacts, test reports, core dumps, `env` dumps uploaded on failure.
- **Child processes.** A dependency's install script inherits `process.env`. So does every tool it shells out to.
- **Error messages from libraries.** An HTTP client that logs the full request on a 500 will happily print the `Authorization` header, assembled at runtime, in a shape the masker does not recognise.

That last one is the common real-world leak. Nobody writes `console.log(process.env.API_KEY)`. Plenty of people enable verbose logging on a flaky integration test.

## The three places to actually look

### 1. Pull requests from forks

The default failure mode: a workflow triggered by a fork's pull request runs the fork's code with the base repository's secrets. Anyone on the internet can open a PR.

The fix is the trigger, not the script. Use the event that runs without secrets for untrusted code, and gate anything that needs credentials behind an explicit approval or a separate, restricted workflow. Treat "does this trigger expose secrets to unreviewed code" as a code-review question on every workflow file change.

### 2. Dependency install scripts

`npm install` runs arbitrary code from every package in the tree, with the full job environment. A postinstall script does not need to exfiltrate to an attacker-controlled host in an obvious way; a DNS lookup of `<base64-of-your-key>.attacker.tld` is enough, and it will not show up as a failed build.

Two controls that pay for themselves:

```bash
# install without running lifecycle scripts
npm ci --ignore-scripts

# and pin what you install
npm ci --frozen-lockfile
```

If a package genuinely needs its postinstall step, allowlist that one package rather than the whole tree. The `ignoreScripts` and `trustedDependencies` fields in this repository's own `package.json` are exactly this pattern.

### 3. The credential's blast radius

The most effective control is not preventing the leak. It is making the leaked value worth less.

| Instead of | Use |
| --- | --- |
| Long-lived cloud access keys in CI settings | OIDC federation: the runner exchanges a short-lived job identity for a token that expires in minutes |
| One org-wide deploy key | Per-repository, per-environment credentials with a single permission each |
| A token that can publish any package | A token scoped to the one package the job publishes |
| Secrets that rotate "when someone leaves" | Automated rotation on a schedule you actually meet |

OIDC in particular changes the shape of the problem. There is no stored secret to leak, the token is bound to a specific repository and workflow, and it is dead before an attacker finishes reading the log.

## Assume it already leaked

Write the runbook now, while nothing is on fire:

1. Revoke first, investigate second. The instinct to "check whether it was actually used" before revoking costs you the window in which revoking helps.
2. Rotate everything issued to that job, not just the value you saw. If one env var got out, assume the environment did.
3. Search the audit log for use of the credential outside your runner IP ranges and outside job windows.
4. Then, and only then, fix the workflow.

The teams that handle this well are not the ones that never leak a credential. They are the ones where leaking a credential is a 20-minute incident instead of a quarter-long one.
