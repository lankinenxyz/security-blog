---
title: "A Threat Model You Can Finish in an Afternoon"
description: "Most threat models die in a 40-page template. Here is a four-question version that a small team can run in three hours and actually act on."
date: 2026-09-08
tags: ["Threat Modelling", "Process"]
author: "Elias Lankinen"
---

Threat modelling has a reputation problem. Teams hear the phrase and picture a consultant, a data-flow diagram nobody updates, and a spreadsheet of 200 "threats" that gets archived the week after it is written. So they skip it, ship the feature, and find out what the threats were from a bug bounty report.

The useful version is much smaller. You need four questions, a whiteboard, and the people who actually wrote the code.

## The four questions

1. **What are we building?** One diagram. Boxes for the things that run code, arrows for the data between them, and a line around whatever you control.
2. **What can go wrong?** Walk the arrows, not the boxes. Every arrow crossing your trust boundary is an opportunity.
3. **What are we going to do about it?** Each accepted threat becomes a ticket, an existing control, or a written decision to accept the risk.
4. **Did we do a good job?** Re-read it when the diagram changes.

That framing comes from Adam Shostack, and the reason it survives contact with a real sprint is that it fits on an index card.

## Draw the boundary first

The single highest-value line on the diagram is the trust boundary: the point where data stops being something you produced and starts being something a stranger sent you.

In a typical web service the boundaries are:

- the browser to your edge (everything the client sends is attacker-controlled, including headers you did not plan for)
- your service to each third-party API (their response is input too)
- your service to the database (parameterised queries are a boundary control, not a style preference)
- your build system to your registry (an artifact is a message from your CI to production)

Teams routinely draw the first one and forget the last three. The build system in particular gets treated as infrastructure rather than as a component that signs and ships executable code on your behalf.

## Walk the arrows with STRIDE

For each arrow, run six prompts. Do not aim for completeness, aim for the two or three that make someone in the room go "huh".

| Prompt | Ask |
| --- | --- |
| **S**poofing | Can someone claim to be this caller? |
| **T**ampering | Can someone modify this in flight or at rest? |
| **R**epudiation | If it happens, will we be able to tell who did it? |
| **I**nformation disclosure | What leaks if this is read by the wrong party? |
| **D**enial of service | What happens if this is called a million times? |
| **E**levation of privilege | Can this path reach something it should not? |

The repudiation row is the one most teams have no answer for, and it is usually the cheapest to fix: log the actor, the action and the target, and keep the log somewhere the application cannot rewrite.

## Write the decision down, not just the risk

A threat model is only worth the afternoon if the output is a decision. Three outcomes are legitimate:

```text
MITIGATE  -> ticket, owner, sprint
TRANSFER  -> contract, insurance, provider's control
ACCEPT    -> written, dated, signed off by someone who can accept it
```

"We'll look at it later" is not one of them. An accepted risk with a name and a date next to it is a fine engineering outcome. An unaccepted risk with nothing next to it is a finding waiting to be someone else's.

## Keep it next to the code

Put the diagram and the decisions in the repository, in Markdown, in the same pull request as the feature that changed them. A threat model in a wiki is a document. A threat model in the repo is a diff, and diffs get reviewed.

Once it lives there, question four answers itself: when an arrow on the diagram changes, the file changes, and the reviewer sees it.
