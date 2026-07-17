# Property Tax Appeal Assistant

An interactive prototype of a guided, do-it-yourself property tax appeal experience for homeowners, anchored to a real county process (Miami-Dade, Florida). Built as a self-directed exercise in turning an ambiguous, high-stakes government workflow into a clear consumer product.

The idea: most homeowners are over-assessed and could lower their tax bill by appealing, but the process is opaque, deadline-driven, and scary enough that almost nobody does it. Full-service firms file on your behalf for a cut. This prototype explores the middle path: the homeowner files their own appeal, and the product hands them everything they need to do it successfully, step by step, with every deadline tracked.

## What it is

A single-file React prototype (~4,700 lines) that walks a homeowner through the entire appeal journey for one property in Miami-Dade County: filing the petition, submitting evidence to two separate county offices, preparing for the hearing, and tracking the result and any refund. It includes 17 screens, a working notification/email/SMS system, downloadable document generation, and demo controls to step through every state of the journey.

Everything is grounded in the actual Miami-Dade Value Adjustment Board process: the DR-486 petition, the two-obligation evidence exchange (Property Appraiser + Special Magistrate via the county's AXIA portal), telephonic hearings, the partial-payment rule, and the recommendation-then-ratification decision flow.

## Why I built it

I wanted a portfolio piece that showed more than "I can wire up a UI." Property tax appeals are a good stress test because the domain is genuinely ambiguous: the rules live across three different county agencies, the deadlines are unforgiving, the terminology is dense, and the failure modes are severe (miss one deadline and you lose the entire year). Turning that into something a nervous first-time homeowner could actually complete required real research and a lot of judgment calls about what to surface, what to hide, and where to reassure.

I used AI tooling heavily throughout: researching county procedures, drafting and iterating on the build, and pressure-testing my own design decisions. The interesting work was in the decisions, not the typing.

## Key design decisions

**One portal, two obligations.** The single most confusing part of the Miami-Dade process is that "submitting evidence" actually means satisfying two separate deadlines to two separate offices (the Property Appraiser 15 days before the hearing, then the Special Magistrate by 9 AM the day before). The prototype models this explicitly as a two-part flow with distinct, color-coded deadline pills, because collapsing it into one step is how homeowners lose.

**Deadlines are the product.** The whole experience is organized around a small number of hard dates, each with escalating reminders across email and SMS. The most catastrophic thing a homeowner can do is miss a deadline, so the design makes deadlines impossible to miss rather than burying them in instructions.

**Honest about what the product can't control.** The homeowner attends the hearing themselves; the magistrate only *recommends* (the board ratifies later); refunds come from a separate office the product can't poll. Rather than paper over these seams, the flow names them, so the product never claims an outcome it can't verify.

**Designed for the losing path too.** Not every appeal wins. There's a full no-reduction flow, including honest messaging and a results-guarantee framing, because how a product handles a loss is as important as how it handles a win.

**Mobile-first, real downloads.** Built to work at phone and desktop widths, since most homeowners will do this on their phone. PDF generation (evidence package, hearing-day packet) works in a sandboxed environment, which took some care to get right on mobile browsers.

## Tech

- Single-file React, no build step required to read it
- Inline design tokens, no external CSS framework
- Client-side PDF generation
- Demo controls on each major screen to walk through every state (pre-filing, filed, evidence due/overdue, hearing set, won, lost)

## Scope and honesty

This is a prototype, not a shipped product. It models one persona (a homesteaded owner) in one county, which was a deliberate choice: go deep on one real process rather than shallow across many. Things I consciously left out, and would build next, include exemption and portability appeals, the catastrophe/hurricane refund path (a Florida-specific and emotionally significant flow), multi-language support, and landlord/multi-property segmentation. The county-specific facts are encoded as config rather than hard-coded logic, which is how I'd approach scaling the same architecture to other counties and states.

## Running it

The prototype is a single React component. Drop it into any React sandbox (or a Vite/CRA app) as the default export and it runs. It uses only React core hooks; no external dependencies are required for the core experience.
