import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// Property Tax Appeal Assistant, DIY workflow (Miami-Dade prototype)
// Single-file interactive prototype for the Operations case study.
// Real property data (address + folio) with a fictional owner persona.
// ============================================================================

// ---- Brand tokens --------------------------------------------
const C = {
  green: "#0E9F6E",
  greenDark: "#066B4A",
  greenSoft: "#E6F6EF",
  greenSofter: "#F2FBF7",
  ink: "#1A2B23",
  body: "#41514A",
  muted: "#7B8A83",
  line: "#E2E8E4",
  card: "#FFFFFF",
  page: "#F6F8F7",
  amber: "#B26A00",
  amberSoft: "#FDF3E2",
  amberLine: "#F0D9AE",
  red: "#B23A3A",
  redSoft: "#FBEDED",
  redLine: "#EFCFCF",
  blue: "#1F6FB2",
  blueSoft: "#E9F2FA",
};

// ---- The case file (single source of truth) --------------------------------
// Add-property pricing: a same-county property reuses the county playbook and is
// a discounted add-on; a different county is a from-scratch build at full price.
const ADD_ON_PRICE = 49;
const FULL_PRICE = 99;

const PROPERTY = {
  owner: "Jane Homeowner",
  address: "11455 SW 117th Ct",
  cityLine: "Miami, FL 33186",
  county: "Miami-Dade County",
  jurisdiction: "Unincorporated Miami-Dade",
  subdivision: "Towngate South Sec 1",
  folio: "30-5912-024-0050",
  petitionNumber: "2026-014782",
  beds: 3,
  baths: 3,
  sqft: 1589,
  assessed: 530000,
  target: 485000,
  marketComps: 485000,
  estSavings: 900,
  homestead: true,
  senior: false,
  trimMailed: "Aug 25, 2026",
  filingDeadline: "Sep 19, 2026",
  hearingDate: "Oct 14, 2026",
  filingDeadlineDateObj: new Date("2026-09-19T23:59:59"),
};

// Real recent sales in the same subdivision (Towngate South). Illustrative comps
// for the demo, a production package would size/condition-adjust these.
const COMPS = [
  { addr: "11770 SW 110th Ln", sold: "$479,500", date: "Oct 2024", sqft: "1,374", sub: "Towngate South" },
  { addr: "11769 SW 108th Ln", sold: "$499,950", date: "Oct 2024", sqft: "1,664", sub: "Towngate South" },
  { addr: "10969 SW 117th Pl", sold: "$459,500", date: "Jan 2025", sqft: "1,452", sub: "Towngate South" },
];

const money = (n) => "$" + n.toLocaleString("en-US");

// ============================================================================
// NOTIFICATION SYSTEM, the connective tissue of the product.
// Because there's no app, email + SMS are how the product reaches the homeowner
// during the months they're not logged in. Each notification has a trigger,
// timing, channel, and purpose. This array is the single source of truth and
// drives both the in-product activity feed and the email/SMS mockups.
// phase: onboarding | filing | waiting | hearing | result
// channel: "email" | "sms" | "both"
// ============================================================================
const NOTIFICATIONS = [
  {
    id: "welcome",
    phase: "onboarding",
    channel: "email",
    when: "Sep 8",
    trigger: "Payment received",
    title: "Welcome, let's start lowering your tax bill",
    sms:
      "Welcome. Your appeal package is ready and we'll guide you through each step. Check your email for the details. Open the app: taxappeal.app",
    preview:
      "Your evidence package is built and your DIY appeal is ready to start. Here's what happens next, and the deadline you need to know.",
    emailBody:
      "Welcome, and thanks for signing up. Your payment is confirmed, and we've taken care of building your evidence package.\n\nHere's how your appeal works from here. There are four steps, and we'll guide you through each one and remind you before every deadline: (1) file your petition with the county, (2) submit your evidence before your hearing, (3) prepare for a short hearing, and (4) track your result and any refund.\n\nThe one date to know right now is your filing deadline: September 19. That's the hard cutoff to get your petition in. It only takes about ten minutes, and we've laid out every value you'll need to enter, so when you're ready you'll just be copying and clicking.\n\nWhen you're ready, open your appeal and start with step one.",
    cta: "Start my appeal",
  },
  {
    id: "welcome_prewindow",
    phase: "onboarding",
    channel: "email",
    when: "Jun 2",
    trigger: "Payment received before the county opens the appeal window",
    title: "You're all set for appeal season",
    sms:
      "You're all set for appeal season, and we'll let you know the moment your county opens for filing. Open the app: taxappeal.app",
    preview:
      "You're signed up and we've started your evidence package. The county hasn't opened the appeal window yet, so there's nothing to do right now, we'll tell you the moment it's time.",
    emailBody:
      "Welcome, and thanks for signing up. Your payment is confirmed and our team has started building your evidence package for this year's appeal.\n\nHere's the thing to know right now: the county hasn't opened the appeal window yet. Appeals can only be filed after the county mails its assessment notices (usually in August), and there's nothing you can or need to do until then.\n\nWhen the window opens, we'll email you right away, lock in your exact filing deadline, and walk you through your first step. Until then, keep an eye out for our next message, that's the one that means it's time to start.",
    cta: null,
  },
  {
    id: "window_open",
    phase: "filing",
    channel: "both",
    when: "Aug 25",
    trigger: "County opens the appeal window / assessment notice mailed",
    title: "The appeal window is open, time to file your petition",
    sms:
      "Your county's appeal window is now open. It's time to file your petition, and we've sent an email with the steps. Open the app: taxappeal.app",
    preview:
      "The county has opened this year's appeal process. Your filing deadline is now set, and your first step is ready. Here's what to do.",
    emailBody:
      "Good news: the county has officially opened this year's appeal process, which means it's time to get started. Your evidence package is ready, and your filing deadline is now locked in: September 19.\n\nYour first step is to file your VAB petition with the county. It's quick and usually only takes about ten minutes. We've laid out every step that's easy to understand and follow. Filing early is the safest move, it protects your deadline and gets the process rolling.\n\nOpen your appeal and start with step one whenever you're ready. We'll be right here to guide you through each step and remind you before every deadline.",
    cta: "File my petition",
  },
  {
    id: "evidence_rebuilt",
    phase: "filing",
    channel: "email",
    when: "Sep 5",
    trigger: "Homeowner changed the property details",
    title: "Your new evidence package is ready",
    sms:
      "Your new evidence package is ready after your address change. Review it before your filing deadline. Open the app: taxappeal.app",
    preview:
      "You updated your property, so we rebuilt your evidence package for the new address. It's ready in your Action Center, and your savings estimate has been updated.",
    emailBody:
      "You updated your property details, so our team rebuilt your evidence package for the new address, and it's ready now.\n\nEverything is tailored to the new property: fresh comparable sales, an updated valuation, and a new savings estimate, which you'll see reflected in your appeal.\n\nNothing changes about your next steps or your deadlines. When you're ready, open your appeal and pick up right where you left off.",
    cta: "See my updated appeal",
  },
  {
    id: "deadline_t7",
    phase: "filing",
    channel: "email",
    when: "Sep 12",
    trigger: "7 days before filing deadline & petition not yet filed",
    title: "File your petition this week, deadline Sep 19",
    sms:
      "Your petition deadline is September 19, about a week away. Filing takes around ten minutes, so it's worth doing now. Open the app: taxappeal.app",
    preview:
      "You have until Sep 19 to file your VAB petition. It takes about 10 minutes and we've laid out everything you need to enter.",
    emailBody:
      "A friendly heads-up: your deadline to file your VAB petition is September 19, about a week away. This is the one hard deadline in the whole process. If it passes without a petition on file, you can't appeal your 2026 assessment, so it's worth doing now while you're thinking about it.\n\nThe good news is it's quick and usually only takes about ten minutes. You'll file on the Miami-Dade VAB portal, and we've laid out every step that's easy to understand and follow.\n\nClick the button below to start your filing today.",
    cta: "File now",
    urgent: true,
  },
  {
    id: "deadline_t2",
    phase: "filing",
    channel: "both",
    when: "Sep 17",
    trigger: "2 days before filing deadline & petition not yet filed",
    title: "2 days left to file, don't lose your appeal",
    sms:
      "Only 2 days left to file your petition before the September 19 deadline. If it passes, you lose your appeal for this year. Open the app: taxappeal.app",
    preview:
      "Your filing deadline is Sep 19. If you miss it, you can't appeal your 2026 assessment. We've made it quick for you to finish in a few minutes.",
    emailBody:
      "This one's important: your filing deadline is September 19, just two days away, and your petition isn't on file yet. If the deadline passes, you lose the chance to appeal your 2026 assessment entirely; there's no extension and no second chance until next year.\n\nWe don't want you to miss it over something that takes a few minutes. We've prepared all the things you need to make the process easy. Filing is mostly copying and clicking, then paying the $15 county fee.\n\nIf you hit any snag at all, reply to this message or open the assistant in your appeal and we'll help you through it right away. Don't let this date slip, finish it today.",
    cta: "File now",
    urgent: true,
  },
  {
    id: "filed_confirm",
    phase: "filing",
    channel: "email",
    when: "Sep 13",
    trigger: "Petition filed (self-attested) + verified on public record",
    title: "Your petition is filed ✓",
    sms:
      "Your petition is filed and confirmed with the county. We'll let you know as soon as your hearing is scheduled. Open the app: taxappeal.app",
    preview:
      "We confirmed your petition with the Miami-Dade VAB. Step one is behind you. Here's what's next.",
    emailBody:
      "Nice work, your petition is filed. We checked the Miami-Dade VAB record and confirmed it's in, so step one is officially behind you.\n\nOne thing to keep in the back of your mind: the partial-payment rule. When your tax bill arrives in November, you'll still need to pay the required portion by the deadline to keep your appeal alive, and we'll remind you well before then.\n\nWhat happens next is mostly waiting. The county will schedule your hearing, usually sometime between October and May, and we're watching for that date daily. The moment it's set, we'll email you and show you how to upload your evidence package. There's nothing you need to do right now.",
    cta: "See what's next",
  },
  {
    id: "keepwarm",
    phase: "waiting",
    channel: "email",
    when: "Sep 22",
    trigger: "Petition filed, hearing not yet scheduled (the quiet gap)",
    title: "We're waiting for your hearing date to be scheduled",
    sms:
      "Your petition is filed and we're now waiting for the county to schedule your hearing. We'll text you the moment it's set. Open the app: taxappeal.app",
    preview:
      "Nothing's wrong, appeals take time. Here's the timeline for what happens between now and your hearing.",
    emailBody:
      "Nothing's wrong, appeals simply take time. Here's what to expect so the quiet stretch doesn't worry you.\n\nFirst, the county schedules hearings on a rolling basis, usually between October and May. Yours hasn't been set yet, and that's completely normal. We're watching the county system daily and will email you the moment your date is assigned.\n\nWhen your hearing is scheduled, two evidence deadlines lock into place: an exchange with the Property Appraiser about 15 days before, and an upload to the county's AXIA portal the day before. You don't need to think about either one yet, we'll walk you through them and remind you well ahead of time.\n\nIn the meantime there's nothing you need to do. Your evidence package is built and waiting, and your petition is filed and confirmed. Just keep an eye out for our next message.",
    cta: null,
  },
  {
    id: "hearing_set",
    phase: "hearing",
    channel: "both",
    when: "Sep 25",
    trigger: "Hearing date detected on county portal",
    title: "Your hearing is scheduled: Oct 14",
    sms:
      "Your hearing is scheduled for October 14. We've locked in your evidence deadlines and will remind you before each one. Open the app: taxappeal.app",
    preview:
      "Your VAB hearing is set for Oct 14. That means two evidence deadlines are now locked in. Tap to see your dates.",
    emailBody:
      "Your hearing date is set: October 14. Now that there's a date on the calendar, your evidence deadlines lock into place, counted backward from your hearing date.\n\nYou'll submit your evidence in one place, the county's online Exchange Portal. You upload your package once for the Property Appraiser (due 15 days before the hearing), then a single Transfer to Axia button sends the same files to the magistrate (due 9:00 AM the day before the hearing). Two deadlines, one portal.\n\nWe'll send you a reminder when it's time to upload, with step-by-step instructions. For now, just know your dates are locked in and we're tracking them for you.",
    cta: "See my deadlines",
  },
  {
    id: "evidence_pa",
    phase: "hearing",
    channel: "both",
    when: "Sep 29",
    trigger: "15 days before hearing, evidence upload due",
    title: "Time-sensitive: upload your evidence package",
    sms:
      "Your evidence is due to the Property Appraiser soon. Upload your package through the county portal. Open the app: taxappeal.app",
    preview:
      "Your evidence is due 15 days before your hearing. Upload it once in the county's Exchange Portal and it covers both the Property Appraiser and the magistrate.",
    emailBody:
      "It's time to submit your evidence, and it's due 15 days before your hearing. The good news is there's one place that handles both parts at once.\n\nUpload your evidence package in the county's VAB Taxpayer Representative Exchange Portal. That records your exchange with the Property Appraiser, and right after uploading, the portal offers a Transfer to Axia button that copies the same files to the magistrate's system, so you don't have to upload twice. Attach the package from your Action Center and your petition number from your filing receipt.\n\nThe county is required to send you their evidence and your property record card at least 15 days before the hearing so you can review what they will be presenting. Open your evidence step and we'll walk you through it line by line.",
    cta: "Open my evidence step",
    urgent: true,
  },
  {
    id: "evidence_axia",
    phase: "hearing",
    channel: "both",
    when: "Oct 13",
    trigger: "Day before hearing, 9 AM, AXIA deadline",
    title: "Time-sensitive: your AXIA deadline is 9 AM tomorrow",
    sms:
      "Your AXIA evidence deadline is 9 AM tomorrow. Open the app and transfer your evidence to the magistrate today. Open the app: taxappeal.app",
    preview:
      "Your evidence must be in the county's AXIA system by 9:00 AM tomorrow, the day before your hearing. This is the step most people miss.",
    emailBody:
      "This is the deadline most people miss, so don't let it slip: your evidence must be in the county's AXIA system by 9:00 AM tomorrow, the day before your hearing.\n\nIf you already clicked Transfer to Axia in the Exchange Portal when you uploaded your evidence, you're covered. This is just your reminder to confirm it went through.\n\nIf you haven't done the transfer yet, open your evidence step now and we'll walk you through it. AXIA is the only thing that puts your evidence in front of the magistrate who decides your case, so it can't be skipped. Handle it tonight so you're covered.",
    cta: "Open my evidence step",
    urgent: true,
  },
  {
    id: "hearing_t1",
    phase: "hearing",
    channel: "both",
    when: "Oct 13",
    trigger: "1 day before hearing",
    title: "Your hearing is tomorrow, here's your hearing packet",
    sms:
      "Your hearing is tomorrow. Download your hearing-day packet and review what to say. Open the app: taxappeal.app",
    preview:
      "Your hearing is Oct 14. Here's your one-page packet, your 30-second script, and what to expect.",
    emailBody:
      "Your hearing is Oct 14. Here's your one-page packet, your 30-second script, and what to expect.\n\nYour hearing will be short, usually about 15 minutes. Here's how it goes: you present first using the 30-second script we've prepared. Then the Property Appraiser responds, and the special magistrate may ask a few questions of either side. You won't get a final decision in the room as the recommendation arrives by mail about 20 days later.\n\nHave your packet and evidence in front of you, stick to the comparable sales, and stay matter-of-fact. That's all it takes.",
    cta: "Open my hearing packet",
  },
  {
    id: "tax_bill",
    phase: "waiting",
    channel: "both",
    when: "Nov 10",
    trigger: "Tax bill mailed & appeal still pending",
    title: "Time-sensitive: pay your tax bill to keep your appeal alive",
    sms:
      "Your tax bill is due soon. Pay the required amount by the deadline or your appeal will be denied, even if you win. Open the app: taxappeal.app",
    preview:
      "Your tax bill is here. Even with a pending appeal, you must pay the required portion by the deadline, or your petition is automatically denied. Here's what to pay.",
    emailBody:
      "Your 2026 tax bill has been mailed, and there's one thing you must do to protect your appeal. Even with your petition pending, Florida law requires you to pay your tax bill by the delinquency date, generally March 31. If you don't, the Value Adjustment Board will automatically deny your petition, even if a magistrate has already recommended reducing your value. This is the single most common way a strong appeal gets thrown out and it's completely avoidable.\n\nThe simplest thing to do is pay your bill in full by the deadline, which also keeps your early-payment discount. If you can't pay all of it right now, Florida law lets you keep your appeal alive by paying most of it (the required minimum is 75% of the main property tax plus any special assessments in full).\n\nIf your mortgage company pays your taxes through an escrow account, they usually handle this for you automatically, so you may not receive a separate bill. It's worth a quick call to your servicer to confirm it's scheduled before the deadline.\n\nIf you win your appeal after paying, the county refunds the difference. So pay on time, keep your appeal alive, and let the process finish.",
    cta: null,
    urgent: true,
  },
  {
    id: "recommendation",
    phase: "result",
    channel: "email",
    when: "Nov 3",
    trigger: "~20 days after hearing",
    title: "Your magistrate's recommendation should arrive soon",
    sms:
      "Your magistrate's recommendation should arrive by mail soon. We'll let you know once the county makes it official. Open the app: taxappeal.app",
    preview:
      "The magistrate usually mails a recommendation within about 20 days. It's not final until the Board ratifies it. We're tracking it for you.",
    emailBody:
      "Just so the quiet after your hearing doesn't worry you, here's what's happening behind the scenes. Magistrates don't make a final decision in the room. They mail a written recommendation usually within about 20 days of the hearing. So if you haven't heard anything yet, that's completely normal.\n\nWhen the recommendation does arrive, keep in mind it isn't the final word. The Value Adjustment Board still has to ratify it at a public meeting before your reduction becomes official and that can be a few more weeks.\n\nWe're watching the public VAB record for you, and the moment your recommendation or final decision posts, we'll update your status and let you know. Tap below to see where things stand right now.",
    cta: "Track my status",
  },
  {
    id: "result_final",
    phase: "result",
    channel: "email",
    when: "Dec 12",
    trigger: "Result reduced & ratified (confirmed on public record)",
    title: "It's official, you saved ~$900/year 🎉",
    sms:
      "Great news: your appeal succeeded and you saved about $900 this year. See the full summary in the app: taxappeal.app",
    preview:
      "Your appeal succeeded. Your assessed value was reduced from $530,000 to $485,000, saving you about $900 a year. Here's how your refund works.",
    emailBody:
      "Congratulations, you did it! Your appeal succeeded. Your 2026 assessed value dropped from $530,000 to $485,000, lowering your property taxes by about $900 this year. And because the reduced value becomes your new baseline, the savings can carry forward in the years ahead too.\n\nHere's what happens with the money. If you'd already paid your tax bill, the Miami-Dade County Tax Collector will issue a refund automatically. Refunds usually arrive within 6 to 8 weeks of the final decision, mailed to your address on record. If your taxes are paid through a mortgage escrow, the refund goes to your lender, so check with your servicer to have it credited back to you. If you hadn't paid yet, you'll simply receive a lower corrected bill.\n\nThat's the whole process, start to finish. Open your appeal to see the full summary, and we'll be in touch next year to check whether it's worth appealing again.",
    cta: "See my savings",
  },
  {
    id: "result_noreduction",
    phase: "result",
    channel: "email",
    when: "Dec 12",
    trigger: "Result, no reduction (Results Guarantee applies)",
    title: "Your appeal result, and what our Results Guarantee means for you",
    sms:
      "Your value wasn't reduced this year, so your Results Guarantee applies and next year's appeal is on us. Details in your email. Open the app: taxappeal.app",
    preview:
      "The board didn't lower your value this year. Because of that, your Results Guarantee kicks in: next year's appeal is on us.",
    emailBody:
      "We wanted to update you on your appeal. This year the Value Adjustment Board decided not to lower your assessed value, so there's no reduction or refund for 2026. We know that's not the outcome you were hoping for, and we're sorry it didn't land this time.\n\nHere's the good news: this is exactly what our Results Guarantee is for. Because your value wasn't reduced, next year's appeal is on us at no cost to you. You don't need to do anything right now to claim it.\n\nAssessments change year to year and a case that doesn't win once can absolutely win the next cycle. We'll keep monitoring your assessment, and when it's worth filing again, we'll reach out and walk you through it.\n\nIf you have any questions about your result or the guarantee, just reply to this email.",
    cta: "See my appeal",
  },
];

const phaseLabel = {
  onboarding: "Getting started",
  filing: "Filing",
  waiting: "While you wait",
  hearing: "Hearing",
  result: "Result",
};

const channelIcon = (ch) =>
  ch === "sms" ? "💬" : "✉️";


// Robust copy that works inside sandboxed iframes. Tries execCommand first
// (more reliable in iframes than the async Clipboard API, which often needs
// permissions the sandbox doesn't grant), then falls back to the Clipboard API.
function copyToClipboard(text) {
  let ok = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    document.body.removeChild(ta);
  } catch (e) {
    ok = false;
  }
  if (!ok && navigator.clipboard?.writeText) {
    try {
      navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {}
  }
  return ok;
}

// ---- Real, pre-rendered PDFs embedded as base64 (no external dependency,
// no print dialog, no scaling issues). Decoded to a Blob and downloaded.
const EVIDENCE_PDF_B64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9aYXBmRGluZ2JhdHMgL05hbWUgL0YzIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXSAvUGFyZW50IDggMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA4IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNyAwIG9iago8PAovQXV0aG9yIChcKGFub255bW91c1wpKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwNjMwMDM1MTM2KzAwJzAwJykgL0NyZWF0b3IgKFwodW5zcGVjaWZpZWRcKSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwNjMwMDM1MTM2KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKFwodW5zcGVjaWZpZWRcKSkgL1RpdGxlIChBYm9kZSBFdmlkZW5jZSBQYWNrYWdlIC0gSmFuZSBIb21lb3duZXIpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDUgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDIwMjUKPj4Kc3RyZWFtCkdhdG08OTM5ay0nXS9eZ2dkTzpsM1Bjcl5aN044VVp1ayJoOkVPLSQlMys9VUApZkhNLV9ZKWVvQHJIbkFWLSpfUik4cVU+US9fT10iN1ZsJ0Y9XDdIUyZoMFlLLS5RI21KSVo0OWBsOyVjXks0NC0iYlhlMD4tSk42LDBFNEdsX1EnayVYXVFEQDI/YlMtRlUkKy0kcipBTjVuVTZNJU1fRC1scjhIaDtSS0w3OiprT3NwJSZYYkFdKzpjOSkzZF8tJDcjISsyWFdrNTA2VExrU0xiQiZBV3BvOltdO3E+ZVwiXXA6XGZaQGJxMS1hbisrIU5GYWQ/OGhQWEtGZFBYOl49TUJiXWhBQikpXDNOazReImo6bEdQXCghMl4tZ3I9LWJAVSpsXjxYOlBabU4lTkttbmspT101TClKO3NqbkFOX3FuOkpWKycmZVxmKTknaStsYCVcLz9FVXNwOm1ca3ArdHFBLk9fdUliJmwhbmQlOF9TY185QkolXiMiZkgvNXInKmJrdVdeazkuP1BvKWU7RTsnbiJnYl48bVhNXCYmLC4yXkFCUWg1OUVvZF5rZERqLkMxbW5aYVozWkVRMylTYz1HZXRVMV03VypdW1VpPik6VCwzP1JydC9adDphS2RmRl9wZShwIiVTRWRDRCVHSztqZVUvP3NBR0RPXDFTUWFcWm9KJjBOW1k0RSJHKTJgXWQ7YmhGP0JfXCk2SiozMHBTckovNkdUKls6PChaSVtaRFdUdGBBKlxyam9qXG5WLCpWbTZ1K0g4MjB0aydIMytubEUtMEskMWpqK1NJMSdHam4hdTdzXE4+PiZBTmhVVGhXMEpRREg/Rk4udTRjYUAjOksybEZiczs2Jk1TJVdTa1Y5JFtsMS9cRV1nOmQtPidINzkuWC4pR0pgK0oxR141LlFqN0lrKT07MFlgaCZrMTE+KUknUiFGY0wsW20yXS1VJ1ExITFXOCk2MG9JKSdvO1pOLzU9aipYJVEpbkg2JmknUT02NXBTIVVSbD9dYUVGI15EW09tX2VPMlN1O3VtSnQ6LiItczonaXQ4Ulxsa2E0UFsxSG1VcTZdS11qMFp1b2ltMzRcKTBpVSRcMkcsS0k0IkM7LURRayFjTjZqXmlEJFNUKFlyVT46WCpUczc9KGpYWnU2OEkqJWFEUCVbYFUrLmxeanE+YUNCLWo6bWMxOGhqalw2Q3U7WFBHVGghNl4yZVYuYHI1LGlzMTc1QTRTWlk1KiwsLTVBVCdyX00+ZVRuN09RK05Ic0JbUjpSUWhuZWxOLT5AK0gmQV9HUURXbl4sSnM1TV5waUhXbl1cbUBfOz1EN1cnXl5dInAmKWZzR086YFlKXCYwMFVEIT5vb2JpWGg5YEcuU1RnPyJiRD5jKlJlVUokVSZTRTVtJkBwMjwyLChUb0Q8TEAmSTxwVlUkIjkpUk4xJTwuZyZMQlU/VGk/MyppRyVLbz1JYT1lOCM8SV0tLSglclw6MVM5OlM3UVtGRU90c0ZnZi4rKSlLLz1DdFUnNDR0SXIuI24yRURrajInNiskKnUpYCElTEhsPllxcFNLO2dMLUVvXDtgNjZvPF9kU2BPSHFkOG0pTTJaLE1RSTkrSVVTanBfL10mQz4lYCRuZGpxW1NvXjZuL0k8ZkRbXHRFdFdlMkdCNjkhWVE1TCpPNlUsKSZWImJZMzxmLF1AUGM+TkQmVSRvJkpMZkRuaUEhYE1yLCZYQlEyMFpDbG4iMmJuV046SWltPFlwdGpWSGknREpGZ0lbV2BHJGhNXkBhWzQnSW9lRkIpPHBHR0dUOmFZYSw4MFBzdXFQbEdGbCU+cSRTUGlkKFleUFc4JThfSV1cT2llcj5GRSY+cjosLV8iTFdCSHQ/aVw3WkdYZyVbUSdqXGBCKzFkJ2lNZ05VQ0hUL0oodE0jSTByUiJPSFVqOGtNXFVCWls8N2pWTT9XM0g7YmFeXDBVLVMuaVNOV2ddY0VHSWM2ZGMrSV9hJ0cjN3EzTGx1NzA8XDp1JytqQk1FLUlJRGxvVStxaWVpXSUtLk5jQTU1YGthPFNfKSFyQG4hMlNOPUVzMFtVZidhMXEtWj06MHIkI0siZ21naFwxdUVeOThrVHEyNjVpaCVaPj1kJG5fbHU+cFN1TChdQydFPmNFaVhMTCdRKTglQklxKSRyJV1VO29GRjdDMHMmLlQsJWtiN20wQksuZCFoZklKJyM3PzlrPUFtQSI3Pm4iYDNZUzdNVmtdJltpSHM/YktEJC40OEAtMmNpXl1uZGprSEgpPTNAOz91aWhxVSdxNkYvPScjcUM9TDRtWEcyTVUlYGpsZjFDVlUuNSIvP0pVQ2AkLCY6LFxpXmo9YGBlLTFSW0dqKSc/dWoodTdkU2BgS1RrUWssbkooSHAmWENfKlRcb1dMVUlhXlcvVT50bnU4U2lOLDBBYWpebl5TPmJQQ2BvQTFcKEBnKEw6TDE7Ry9TRipxNjM4KEQqRW8kOiZUWEhhZ0sxcXBDRU1nUSZSVjIqZ09BLk42dTIlIyNeazMpbjw2KWhxcF9nTCZKPWRfJURGOEc4YF0vbyZdI0svU25NP2ViITZRPFooaVJxR1tWNmMpTkA3aU8hSDYwT0oqYkFSVz0xUnMpKW5APTInLWJfRkNUKlhHLWQyOXBSMFU7J2hCcjxJR2JXSCV+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTEyIDAwMDAwIG4gCjAwMDAwMDAyMTkgMDAwMDAgbiAKMDAwMDAwMDMzMSAwMDAwMCBuIAowMDAwMDAwNDE0IDAwMDAwIG4gCjAwMDAwMDA2MDcgMDAwMDAgbiAKMDAwMDAwMDY3NSAwMDAwMCBuIAowMDAwMDAwOTgxIDAwMDAwIG4gCjAwMDAwMDEwNDAgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8MDQwZmEwNjc3NDZlZWRlOTc0ZjA3ZmUzZjMxYWU4NzE+PDA0MGZhMDY3NzQ2ZWVkZTk3NGYwN2ZlM2YzMWFlODcxPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA3IDAgUgovUm9vdCA2IDAgUgovU2l6ZSAxMAo+PgpzdGFydHhyZWYKMzE1NgolJUVPRgo=";
const HEARING_PDF_B64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9TeW1ib2wgL05hbWUgL0YzIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXSAvUGFyZW50IDggMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA4IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNyAwIG9iago8PAovQXV0aG9yIChcKGFub255bW91c1wpKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwNjMwMDM1MTM2KzAwJzAwJykgL0NyZWF0b3IgKFwodW5zcGVjaWZpZWRcKSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwNjMwMDM1MTM2KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKFwodW5zcGVjaWZpZWRcKSkgL1RpdGxlIChBYm9kZSBIZWFyaW5nLURheSBQYWNrZXQgLSBKYW5lIEhvbWVvd25lcikgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAxIC9LaWRzIFsgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTkwNAo+PgpzdHJlYW0KR2F0bTw+QWswOCdSbFpdRUotUy9XMHQlVkdNXWhcRjppMXBXPjtWYyhPK2phIio0Yyk6OidjanFxN1E0OGlkOSMnaUV1JCo7ZU8rbWorRD9yYy5oJz0lIl5Ga2ROTEBcPWZsP25eJWcybDk1KXBqYUhsSjAsWlE8Ny1fZihwTyFhMSkmKSlPLClBV1ZJTWhQcyQpakRBWzNtKSdHbkRpSk0pRmNfTWRrSTAvMG1JKV9VKVRxYiEhKCM8W2Fjck0vRD5mMS5OVU8xN3RFK0ZzXTByaEIlSz4kalcnbUZLYU11R206YWpLZj1BQElHNDhuYzwyN19UI1ZebWNiRmZkU25CYypUPnRYcychK0FDVTwlUzcwXycjQCY+S1MwJz51Wz8yJWM0Q1NjQDA/Pi5SXD0vYUUvbVtHOSwhUj1BMDMuOiVAdVgoTmNWVEMxcj1KakstWiJsLHVsLUFOSHJJW0Q+QyFWb1U2R25PVnBrLnMpPms8K0VnVD4ocm9rUVNaSjZycmRQWz41Sz83SipIK01oVjlrTSkkXDE5Uz0pISt1VWJzUiMiPldJcV0iLyVRWS5FTFtpckgtVD5kSGVDXG5CLlZfdGQuNS1VVT0mV2tWSyM1X1dZIWQvcSpzclZSQUorXTdQL1ImTFY7LzJIJ3VOSyosZSR1NUA/ODZmNlEvVFhtKkFBXiNDMHBBYU5YYmUyTWd1NVpoRUllVEorV2lwN0E0L0hJJDFmRiUpW3MtdVtVOWsvdExTM1ZHZStaIzUwJDxKM1xLMkJLImxHM0xiJltGW3U0VkhBZVE0N1hWY25DVCQsRmlEUTxWIzRVZGRlVXFsPWZQTUBUJWowJl1sKUZeaCgrNmdxRz44NVw9YmVMLjB0LzorJiIvQyNmZlIuSihhVltcbFMzY0phWy1Pa2QlMGVAakknUCc8a0NRQSc5QUdSL04lKUFlKXVCNy03VV09PmpIWU1sJU9PbGRgIlA8TlNpOVNcajlLRElwQFZvSmQzMSJfM01mL1x1VWdkdVF0WWlkOGA9bWpOK1NBT2tRa1xTUEdETzJFZltCM2gtJmdwbFpOOWlua1tsTUJhOSxpN01bPSgkJzA3MmE6cypvL2hQbColUkA3SSgxTmYtTDg6S1NhRipgdD1jTDZGUzpVTUI6cUQzVjlldG9tSyReNWAoRUsoRUNcM2dRTTZdX2AjTmpKXSM9N3BOYFs9P2FlKydNSzFXWDooNFk/ZVxjUUYjIz1LTG9dTTUiRTNkPCFwYDFycyIiWE9TQm1mWzVbK0RmKCotX0NyZW5SXkpdYjhNbl0/QypAZysxcUcpdF0rWm0yZ0k/QDUsaiUmUGpJalZublpwSzAtSmVmclJhdSdKMTwkZF1AOTloKF5lc1pZNVJ0JiVBR1dAU2krMCNwWWZkZ2ktYTBlSz0kSFpuKmU1ZVg8UzEnbEJsNT4vNzhKL0FLJExbVFVpa1puWkYiRE10S29GN24+RS9jXiE4Z1xIUzViWy9iT1pGLUxXYVxtOVxFTmYuTlNBWEUwaE1PJStZN1Emaz5kZ3MlPCIlMGVBUSlBZGs7KVY2VGFFVSQmLlVmTj1vdC9BPCwxW0hCOHI3Zy8xWmwrZlU5dFY4c1tOcjlGZ2g4U14sUj5PSXFmLihTLEg/PF0hZjpQMVRTZm9VVjZuYm5YV1JlbnErZ1dfRjd1V2whWzolOCwnLk0qdDNJZCZNX1pqYkQ/Pz89NEJZJSdlSV8sZTs7J1ZoOE9YM0lnUCYzbzQsLUk2YDAjSHBOPzw5JTwoMEEjIT9RWkU8Q0MlTU9SJzFlVU1dcEJSTENTc3MsOXBqYjE0bG4+dTtcMmtITV0xM3IkWTRbWmk4InJuIik+Jk11PGROdCRnUEZBJ21QXnVyZ18hRmVEKlhMSmUpSWgiOVpER1UqMjNXKUZPWmhJTkcwLWBDbC1dPzVMKy1daCxuTD9hTWlWbylyWVtDT2ZtbyxGOVI8Mlk+aEQvak4yX0dBLDo+dWwscl4nIi48OytgbXNgS2c+NTEjW2VSIjZPNlpYNUxPJmQ0cEdYZEdAIzo5KEBHVShNLF91NUMsb0VrJlpudDJpUz5KLC1YYyEjcTRLT0VkV25PNSgwNEtBY0NqOCooKV41ZUgicWU9MERQc0I/NDlXMWVSImNmamxtMitBXE00OVshcz9tXz9OVD1vKkNUdUBOSF91PzpbKTI2VlQxZmBtMlZyMVVCL3NYK1paI0xtP0ByQCtNSDk7KlMmQ0ZgTzpobmE1JmZXQWpXJDVdcEMmUEErI2MhWjpRX10lXHQmZyVkKVhwJWFgIkgidFdlOldUQmtSZWIuQ2ReQDxxJCMkVVRSMnVCNT9oXTo9IlMmWHUpZjw8SEY7O1xnbFhYcmkwb01GYEEzI14kRE8yU0pKJixzUiZxP21RVnFaQCtKNUNnQ0hwYiFwZyY0KS4rRE9SUSEldTs/MyJbVk5UM0xlNk0mbyRwWUIkNyRqT0pUKG5UdVsuXW5UI0tCcCozQWlJbytMKDs/fj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExMiAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCjAwMDAwMDAzMzEgMDAwMDAgbiAKMDAwMDAwMDQwOCAwMDAwMCBuIAowMDAwMDAwNjAxIDAwMDAwIG4gCjAwMDAwMDA2NjkgMDAwMDAgbiAKMDAwMDAwMDk3NyAwMDAwMCBuIAowMDAwMDAxMDM2IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDNlNjlhMzY4NjQyMTUzYzRhZTMwOGIwYjA4MDVjM2ZiPjwzZTY5YTM2ODY0MjE1M2M0YWUzMDhiMGIwODA1YzNmYj5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNyAwIFIKL1Jvb3QgNiAwIFIKL1NpemUgMTAKPj4Kc3RhcnR4cmVmCjMwMzEKJSVFT0YK";

function downloadPdf(b64, filename) {
  try {
    const isMobile =
      /iP(hone|ad|od)|Android/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // On mobile (and inside a sandboxed Artifact iframe), blob URLs opened in a
    // new tab are often blocked or revoked before they render. A self-contained
    // data URI carries the bytes inline, so the PDF reliably opens in a new tab.
    if (isMobile) {
      const dataUri = "data:application/pdf;base64," + b64;
      const a = document.createElement("a");
      a.href = dataUri;
      // The download attribute is honored by Android Chrome and iOS for data
      // URIs and avoids the new-tab data: navigation block on Android. iOS
      // opens it in the PDF viewer either way.
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Desktop: real file download via blob + download attribute.
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    alert("Could not download the PDF. Please try again.");
  }
}

function downloadEvidencePackage() {
  downloadPdf(EVIDENCE_PDF_B64, `${PROPERTY.address} Evidence Package 2026.pdf`);
}

function downloadHearingPacket() {
  downloadPdf(HEARING_PDF_B64, `${PROPERTY.address} Hearing Day Packet 2026.pdf`);
}


// ---- Demo clock: fixed "today" so the countdown is stable in the demo ------
// Production uses the live date with estimated/confirmed deadline states;
// for the demo we hold "today" at Sep 6 so it always reads "10 days left".
const TODAY = new Date("2026-09-10T09:00:00");
const WINDOW_START = new Date("2026-08-25T00:00:00");
const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));
const daysLeft = daysBetween(TODAY, PROPERTY.filingDeadlineDateObj);
const windowTotal = daysBetween(WINDOW_START, PROPERTY.filingDeadlineDateObj);
const windowElapsed = daysBetween(WINDOW_START, TODAY);
const windowPct = Math.min(100, Math.max(0, (windowElapsed / windowTotal) * 100));

// Hearing-relative evidence deadlines (used once a hearing date is confirmed).
// Hearing Oct 14 → Track 1 (Property Appraiser) due 15 days prior = Sep 29;
// Track 2 (AXIA) due 9 AM the day before = Oct 13.
const HEARING_DATES = { track1: "Sep 29, 2026", track2: "Oct 13, 2026" };

// ===========================================================================
// Small shared UI atoms
// ===========================================================================
function Logo({ light }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: light ? "#fff" : C.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: light ? C.green : "#fff",
          fontWeight: 700,
          fontSize: 16,
          fontFamily: "Georgia, serif",
        }}
      >
        A
      </div>
      <span
        style={{
          fontWeight: 600,
          fontSize: 17,
          color: light ? "#fff" : C.ink,
          letterSpacing: "-0.01em",
        }}
      >
        Tax<span style={{ color: light ? "#fff" : C.green }}>Appeal</span>
      </span>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, full, small }) {
  const base = {
    border: "1px solid transparent",
    borderRadius: 10,
    padding: small ? "8px 14px" : "13px 22px",
    fontSize: small ? 14 : 15,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    width: full ? "100%" : "auto",
    fontFamily: "inherit",
    transition: "transform .05s ease, box-shadow .15s ease, background .15s ease",
    opacity: disabled ? 0.45 : 1,
  };
  const styles = {
    primary: { background: C.green, color: "#fff" },
    dark: { background: C.ink, color: "#fff" },
    ghost: { background: "#fff", color: C.ink, border: `1px solid ${C.line}` },
    soft: { background: C.greenSoft, color: C.greenDark },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...styles[variant] }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PropertyBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: C.greenSofter,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "9px 12px",
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>🏠</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>
          {PROPERTY.address}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.3 }}>
          {PROPERTY.cityLine} · Folio {PROPERTY.folio}
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "green" }) {
  const map = {
    green: { bg: C.greenSoft, fg: C.greenDark },
    amber: { bg: C.amberSoft, fg: C.amber },
    red: { bg: C.redSoft, fg: C.red },
    blue: { bg: C.blueSoft, fg: C.blue },
    gray: { bg: "#EEF1EF", fg: C.muted },
  };
  const t = map[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 12.5,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ===========================================================================
// Persistent AI chat bubble (non-interactive placeholder)
// ===========================================================================
// Knowledge base the assistant answers from. In production this is retrieval
// over the product's county playbooks + the homeowner's case data; here it's a small
// curated set covering the real questions a Miami-Dade filer asks.
const ASSISTANT_QA = [
  {
    q: "When is my filing deadline?",
    a: "Your petition is due Sep 19, 2026, that's 25 days after your TRIM notice mailed (Aug 25). This deadline is hard: if you miss it, you can't appeal your 2026 value. We've laid out everything you need to enter in Step 1, so it only takes a few minutes.",
  },
  {
    q: "Do I still pay my tax bill while appealing?",
    a: "Yes, and this trips people up. Even with a pending appeal, you must pay the required portion of your tax bill by the deadline (around March 31). If you don't, the VAB automatically denies your petition, even if your case is strong. We'll remind you when your bill arrives in November and tell you exactly what to pay.",
  },
  {
    q: "What if I miss the evidence upload?",
    a: "It's not as fatal as the filing deadline. The AXIA upload is due 9 AM the day before your hearing, but if you miss it, your hearing still happens and the magistrate may still choose to admit late evidence. Still, upload on time when you can, it's the safest path, and it's the step most people forget.",
  },
  {
    q: "What happens at the hearing?",
    a: "It's short, usually 15 minutes, often by phone. You present first (we give you a 30-second script with your numbers), then the Property Appraiser responds, and the magistrate may ask questions. You won't get a decision in the room: the recommendation arrives by mail about 20 days later.",
  },
  {
    q: "Is my evidence good enough?",
    a: "Your package uses recent sales of similar nearby homes that support a value around $485,000, below your $530,000 assessment. That's exactly the kind of evidence VAB magistrates weigh most heavily. Bring it organized and stick to the numbers, and you're presenting a solid case.",
  },
  {
    q: "How much will I save?",
    a: "Based on your target value of $485,000, the estimated reduction saves you about $900 a year. The exact figure depends on the final value the Board approves, but that's the ballpark we're aiming for.",
  },
];

function ChatBubble({ openSignal }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // "chat" | "human" | "sent"
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  // Nav "Help" bumps openSignal to open the assistant from anywhere.
  useEffect(() => {
    if (openSignal) { setOpen(true); setView("chat"); }
  }, [openSignal]);
  const [msgs, setMsgs] = useState([
    {
      from: "bot",
      text:
        "Hi Jane, I'm your appeal assistant. I know your case and the Miami-Dade process. Ask me anything, or tap a question below.",
    },
  ]);
  const [asked, setAsked] = useState([]);
  const [draft, setDraft] = useState("");

  const sendTyped = () => {
    const q = draft.trim();
    if (!q) return;
    setMsgs((m) => [
      ...m,
      { from: "user", text: q },
      { from: "bot", text: "Thanks for asking. I can help with anything about your Miami-Dade appeal, your deadlines, or the evidence steps. If you'd rather talk to a person, tap \u201cReach a human\u201d below and our team will email you within one business day." },
    ]);
    setDraft("");
  };

  const ask = (item) => {
    setMsgs((m) => [...m, { from: "user", text: item.q }, { from: "bot", text: item.a }]);
    setAsked((a) => [...a, item.q]);
  };

  const remaining = ASSISTANT_QA.filter((x) => !asked.includes(x.q));
  const CATEGORIES = [
    "Filing / the county site",
    "Evidence (the two tracks)",
    "My hearing",
    "Deadlines & the tax bill",
    "My result / refund",
    "Billing & account",
    "Something else",
  ];
  const canSubmit = category && subject.trim() && description.trim();

  const inputStyle = {
    width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 8,
    padding: "9px 11px", fontSize: 13, color: C.ink, fontFamily: "inherit", outline: "none", background: "#fff",
  };

  return (
    <div className="chat-fab" style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60 }}>
      {open && (
        <div
          style={{
            width: 320,
            maxWidth: "calc(100vw - 36px)",
            background: "#fff",
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            boxShadow: "0 12px 30px rgba(20,40,30,.16)",
            marginBottom: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: 480,
          }}
        >
          {/* header */}
          <div style={{ background: C.green, color: "#fff", padding: "12px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            {view !== "chat" && (
              <button
                onClick={() => setView("chat")}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 15, flexShrink: 0 }}
                aria-label="Back"
              >
                ←
              </button>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {view === "chat" ? "Appeal Assistant" : "Contact a human"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {view === "chat" ? "" : "We'll email you within one business day"}
              </div>
            </div>
          </div>

          {view === "chat" && (
            <>
              <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                    <div
                      style={{
                        maxWidth: "85%",
                        background: m.from === "user" ? C.green : C.greenSofter,
                        color: m.from === "user" ? "#fff" : C.body,
                        border: m.from === "user" ? "none" : `1px solid ${C.line}`,
                        borderRadius: m.from === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        padding: "9px 11px",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {remaining.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                      {asked.length ? "Other questions:" : "Common questions:"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {remaining.slice(0, 3).map((item) => (
                        <button
                          key={item.q}
                          onClick={() => ask(item)}
                          style={{ textAlign: "left", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: 12.5, color: C.greenDark, fontWeight: 600, cursor: "pointer" }}
                        >
                          {item.q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 12px", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendTyped(); }}
                  placeholder="Ask a question…"
                  style={{
                    flex: 1, border: `1px solid ${C.line}`, borderRadius: 20, padding: "9px 13px",
                    fontSize: 13, color: C.ink, fontFamily: "inherit", outline: "none", background: "#fff", minWidth: 0,
                  }}
                />
                <button
                  onClick={sendTyped}
                  disabled={!draft.trim()}
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: "50%", border: "none",
                    background: draft.trim() ? C.green : "#D5DBD7", color: "#fff", fontSize: 16,
                    cursor: draft.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  aria-label="Send"
                >
                  ↑
                </button>
              </div>
              <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 14px", fontSize: 12, color: C.muted, lineHeight: 1.5, flexShrink: 0 }}>
                Still stuck?{" "}
                <span onClick={() => setView("human")} style={{ color: C.green, fontWeight: 600, cursor: "pointer" }}>
                  Reach a human →
                </span>
              </div>
            </>
          )}

          {view === "human" && (
            <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
              <div style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5, marginBottom: 12 }}>
                Tell us what's going on and our team will follow up by email.
              </div>

              <label style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "auto", marginBottom: 12 }}>
                <option value="">Choose a topic…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A one-line summary" style={{ ...inputStyle, marginBottom: 12 }} />

              <label style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening, and what have you tried?" rows={4} style={{ ...inputStyle, resize: "vertical", marginBottom: 14 }} />

              <button
                onClick={() => canSubmit && setView("sent")}
                disabled={!canSubmit}
                style={{ width: "100%", background: canSubmit ? C.green : "#B7C2BC", color: "#fff", border: "none", borderRadius: 9, padding: "11px 14px", fontSize: 13.5, fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}
              >
                Send to the support team
              </button>
            </div>
          )}

          {view === "sent" && (
            <div style={{ padding: 20, textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Message sent</div>
              <div style={{ fontSize: 13, color: C.body, lineHeight: 1.55, marginBottom: 16 }}>
                Thanks, Jane. Our team will email you at jane@email.com within one business day. If it's about a deadline in the next 48 hours, we'll prioritize it.
              </div>
              <button
                onClick={() => { setView("chat"); setCategory(""); setSubject(""); setDescription(""); }}
                style={{ background: "none", border: `1px solid ${C.line}`, color: C.greenDark, borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Back to assistant
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: C.green,
          border: "none",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(14,159,110,.4)",
          marginLeft: "auto",
          display: "block",
        }}
        aria-label="Open Appeal Assistant"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}

// Device-aware handoff banner, shown on the steps that involve clunky county
// portals that aren't mobile-friendly. The product meets the homeowner on
// mobile but routes the heavy lifting (uploads, the portal) to desktop.
function DeviceHandoff({ children }) {
  const [sent, setSent] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
        background: C.blueSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 18,
      }}
    >
      <span style={{ fontSize: 17 }}>🖥️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>
          {children}
        </div>
        {sent ? (
          <div style={{ fontSize: 12.5, color: C.greenDark, fontWeight: 600, marginTop: 8 }}>
            ✓ Link sent, check your email when you're at a computer.
          </div>
        ) : (
          <button
            onClick={() => setSent(true)}
            style={{
              marginTop: 9,
              background: "#fff",
              border: `1px solid ${C.blue}`,
              color: C.blue,
              borderRadius: 8,
              padding: "7px 13px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Email me a link to finish on my computer
          </button>
        )}
      </div>
    </div>
  );
}

// "Why are we asking this?" expandable micro-explainer. Bureaucratic steps feel
// sketchy; over-explaining builds the trust a self-file product needs.
function WhyThis({ children, label = "Why are we asking you to do this?" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          color: C.greenDark,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          textAlign: "left",
          width: "100%",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        <span style={{ lineHeight: 1.4, textAlign: "left" }}>{label}</span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12.5,
            color: C.body,
            lineHeight: 1.6,
            background: C.greenSofter,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "11px 13px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// App chrome, top bar shown on logged-in screens
// ===========================================================================
function TopBar({ onHome, onBell, onProfile, unread = 0, standalone }) {
  return (
    <div
      className={standalone ? "app-topbar-standalone" : "app-topbar"}
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 22px",
        borderBottom: `1px solid ${C.line}`,
        background: "#fff",
      }}
    >
      <div onClick={onHome} className="topbar-logo" style={{ cursor: "pointer", marginLeft: 40 }}>
        <Logo />
      </div>
      {!standalone && (
      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onBell && (
          <button
            onClick={onBell}
            aria-label="Notifications"
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            🔔
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 99,
                  background: C.red,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                {unread}
              </span>
            )}
          </button>
        )}
        <span
          onClick={onProfile}
          className="topbar-name"
          style={{ fontSize: 13.5, color: C.muted, cursor: onProfile ? "pointer" : "default" }}
        >
          {PROPERTY.owner}
        </span>
        <div
          onClick={onProfile}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: C.greenSoft,
            color: C.greenDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            cursor: onProfile ? "pointer" : "default",
          }}
        >
          JH
        </div>
      </div>
      )}
    </div>
  );
}

// ===========================================================================
// SCREEN 1, Welcome
// ===========================================================================
function Welcome({ go }) {
  return (
    <div
      style={{
        minHeight: 560,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: 28,
        position: "relative",
      }}
    >
      <Logo />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 470,
          margin: "0 auto",
          textAlign: "center",
          color: C.ink,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: C.green,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          DIY Appeal
        </div>
        <h1
          style={{
            fontSize: 34,
            lineHeight: 1.15,
            margin: "0 0 16px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: C.ink,
          }}
        >
          You’re in, Jane. Let’s start lowering your tax bill.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: C.body, margin: "0 0 30px" }}>
          We’ve taken care of building your evidence package. Next, we’ll confirm
          your property and walk you through filing the appeal yourself, step by step, so you
          stay in control and keep 100% of what you save.
        </p>
        <div>
          <button
            onClick={() => go("addProperty")}
            style={{
              background: C.green,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "15px 32px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(14,159,110,.28)",
            }}
          >
            Let’s begin →
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 2, Confirm your property (data already on file from signup)
// ===========================================================================
// Stable field component (defined once at module scope so it isn't recreated
// on every keystroke, recreating it would drop input focus mid-typing).
function CField({ label, value, onChange, last, options }) {
  const sharedStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    fontWeight: 600,
    color: C.ink,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
  };
  return (
    <div style={{ marginBottom: last ? 0 : 10 }}>
      <label style={{ fontSize: 11.5, color: C.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...sharedStyle, appearance: "auto" }}
          onFocus={(e) => (e.target.style.borderColor = C.green)}
          onBlur={(e) => (e.target.style.borderColor = C.line)}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={sharedStyle}
          onFocus={(e) => (e.target.style.borderColor = C.green)}
          onBlur={(e) => (e.target.style.borderColor = C.line)}
        />
      )}
    </div>
  );
}

function ConfirmProperty({ go, nav, unread }) {
  const addMode = nav?.mode === "add";
  const [editing, setEditing] = useState(addMode);

  // Original values on file
  const ORIG = {
    street: PROPERTY.address,
    unit: "",
    city: "Miami",
    state: "Florida",
    zip: "33186",
    county: "Miami-Dade",
  };
  const BLANK = { street: "", unit: "", city: "", state: "Florida", zip: "", county: "Miami-Dade" };
  const [fields, setFields] = useState(addMode ? BLANK : ORIG);
  const setF = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const changed = Object.keys(ORIG).some((k) => fields[k].trim() !== ORIG[k].trim());
  // Same-county detection drives pricing: same county is a discounted add-on;
  // a different county is a from-scratch build at full price.
  const norm = (s) => s.trim().toLowerCase().replace(/\s+county$/, "");
  const sameCounty = norm(fields.county) === norm(ORIG.county);

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} standalone />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <h2
          style={{
            fontSize: 25,
            color: C.ink,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          {addMode ? "Let’s add your additional property" : "Let’s confirm the property we’re appealing"}
        </h2>
        <p style={{ color: C.body, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
          {addMode
            ? "Each property is its own appeal with its own evidence package. Enter the address below. We currently handles Miami-Dade County, so a second Miami-Dade property is a quick, discounted add-on."
            : "This is the property from your signup. Make sure it’s right before we continue as everything we’ve prepared is built around it."}
        </p>

        <Card>
          <div
            style={{
              background: C.greenSoft,
              margin: "-22px -22px 18px",
              padding: "12px 22px",
              fontSize: 13,
              fontWeight: 600,
              color: C.greenDark,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🏠</span> {addMode ? "Your additional property" : "The property on your account"}
          </div>

          {!editing ? (
            <>
              {/* Read-only confirmation display, they recognize, not re-enter */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>
                  {PROPERTY.address}
                </div>
                <div style={{ fontSize: 15, color: C.body, marginTop: 2 }}>
                  {PROPERTY.cityLine}
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
                  Miami-Dade County
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                <Btn onClick={() => go("confirmed")}>Yes, this is my property →</Btn>
                <Btn variant="ghost" onClick={() => setEditing(true)}>
                  Edit details
                </Btn>
              </div>
            </>
          ) : (
            <>
              {/* Edit path, controlled fields with change detection */}
              {/* Row 1: street address (wide) + unit (small) */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 3 }}>
                  <CField label="Street address" value={fields.street} onChange={(v) => setF("street", v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <CField label="Unit #" value={fields.unit} onChange={(v) => setF("unit", v)} />
                </div>
              </div>
              {/* Row 2: city (left) + state dropdown + zip (right) */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <CField label="City" value={fields.city} onChange={(v) => setF("city", v)} />
                </div>
                <div style={{ flex: 1.4 }}>
                  <CField label="State" value={fields.state} onChange={(v) => setF("state", v)} options={["Florida"]} />
                </div>
                <div style={{ flex: 1.2 }}>
                  <CField label="ZIP" value={fields.zip} onChange={(v) => setF("zip", v)} />
                </div>
              </div>
              {/* Row 3: county */}
              <CField label="County" value={fields.county} onChange={(v) => setF("county", v)} last />

              {addMode ? (
                sameCounty ? (
                  <div
                    style={{
                      marginTop: 16,
                      background: C.greenSofter,
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13.5,
                      color: C.ink,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: C.greenDark }}>Same county, so this is fast.</strong> The
                    Miami-Dade process is identical to your first property, so you already know the
                    steps. We’ll build a fresh evidence package for this address for a{" "}
                    <strong>$49 add-on</strong>, much less than a first property.
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 16,
                      background: C.blueSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13.5,
                      color: C.ink,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: C.blue }}>We’re not in this county yet.</strong> We
                    currently handles appeals in Miami-Dade County only. We’re working on expanding
                    to {fields.county ? `${fields.county} County` : "your new property’s county"}, and
                    we’ll email you the moment it’s available so you can appeal there too.
                  </div>
                )
              ) : changed ? (
                <div
                  style={{
                    marginTop: 16,
                    background: C.amberSoft,
                    border: `1px solid ${C.amberLine}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 13.5,
                    color: C.ink,
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: C.amber }}>Heads up.</strong> Your appeal package
                  was built for the original address. Change it and we’ll rebuild the evidence
                  package for the new property, well before your deadline.
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                {addMode ? (
                  sameCounty ? (
                    <>
                      <Btn
                        onClick={() => go("payAddProperty", { addr: fields.street, city: fields.city, zip: fields.zip, county: fields.county, sameCounty })}
                        disabled={!fields.street.trim() || !fields.zip.trim() || !fields.county.trim()}
                      >
                        Continue to payment →
                      </Btn>
                      <Btn variant="ghost" onClick={() => go("account")}>
                        Cancel
                      </Btn>
                    </>
                  ) : (
                    <Btn full onClick={() => go("account")}>
                      Back to my properties
                    </Btn>
                  )
                ) : (
                  <>
                    <Btn onClick={() => go("confirmed")}>Save and continue →</Btn>
                    <Btn variant="ghost" onClick={() => { setFields(ORIG); setEditing(false); }}>
                      Cancel
                    </Btn>
                  </>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, mono, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: last ? "none" : `1px solid ${C.line}`,
      }}
    >
      <span style={{ fontSize: 13.5, color: C.muted }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          color: C.ink,
          fontWeight: 600,
          fontFamily: mono ? "ui-monospace, Menlo, monospace" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ===========================================================================
// SCREEN, Add-property payment (fake checkout for the extra appeal)
// ===========================================================================
function AddPropertyPayment({ go, back, nav }) {
  const price = ADD_ON_PRICE;
  const addr = nav?.addr || "your new property";
  const cityLine = [nav?.city, "FL", nav?.zip].filter(Boolean).join(", ");
  const county = nav?.county || "Miami-Dade";
  const [paying, setPaying] = useState(false);
  const [useOnFile, setUseOnFile] = useState(true);

  const pay = () => {
    setPaying(true);
    setTimeout(() => go("account", { added: true, addedAddr: addr, addedCity: cityLine }), 900);
  };

  return (
    <div style={{ background: C.page, minHeight: 560 }}>
      <TopBar onHome={() => go("welcome")} onProfile={() => go("account")} />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(18px,5vw,26px) clamp(14px,4vw,22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 24, color: C.ink, margin: "6px 0 6px" }}>Add this property</h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
          One-time charge to build and file this appeal. Your annual subscription is unchanged.
        </p>

        {/* Order summary */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 10 }}>Order summary</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{addr}</div>
              {cityLine && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 1 }}>{cityLine}</div>}
              <div style={{ fontSize: 12, color: C.greenDark, marginTop: 4, fontWeight: 600 }}>
                {county} · same-county add-on
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, flexShrink: 0 }}>{money(price)}</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Total due today</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.greenDark }}>{money(price)}</span>
          </div>
        </Card>

        {/* Payment method */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 10 }}>Payment method</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: useOnFile ? 0 : 12 }}>
            <input type="radio" checked={useOnFile} onChange={() => setUseOnFile(true)} />
            <span style={{ fontSize: 14.5, color: C.ink, fontWeight: 600 }}>Visa ···· 4242</span>
            <span style={{ fontSize: 12, color: C.muted }}>on file</span>
          </label>
          {!useOnFile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <input placeholder="Card number" style={payInput} />
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="MM / YY" style={{ ...payInput, flex: 1 }} />
                <input placeholder="CVC" style={{ ...payInput, flex: 1 }} />
              </div>
            </div>
          )}
          <button
            onClick={() => setUseOnFile((v) => !v)}
            style={{ background: "none", border: "none", color: C.greenDark, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "10px 0 0" }}
          >
            {useOnFile ? "Use a different card" : "Use card on file"}
          </button>
        </Card>

        <Btn full onClick={pay} disabled={paying}>
          {paying ? "Processing…" : `Pay ${money(price)} and add property`}
        </Btn>
      </div>
    </div>
  );
}
const payInput = { border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14.5, fontFamily: "inherit", outline: "none", color: C.ink, background: "#fff", width: "100%" };

// ===========================================================================
// SCREEN 3, Property confirmed (the stakes reveal)
// ===========================================================================
function Confirmed({ go, nav, edge, setEdge, unread }) {
  const reduction = PROPERTY.assessed - PROPERTY.target;
  const [rebuilding, setRebuilding] = useState(nav?.rebuilding || false);
  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} standalone />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <h2 style={{ fontSize: 25, color: C.ink, margin: "0 0 4px" }}>
          Here’s what we’ll be appealing
        </h2>
        <p style={{ color: C.body, fontSize: 14.5, margin: "0 0 22px" }}>
          {PROPERTY.address}, {PROPERTY.cityLine}
        </p>

        {/* The savings reveal, or a rebuilding state if the address was changed */}
        {rebuilding ? (
          <Card style={{ background: C.amberSoft, borderColor: C.amberLine, minHeight: 214, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 20, lineHeight: 1.4 }}>🛠️</span>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                  We’re rebuilding your evidence package
                </div>
                <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55 }}>
                  Because you changed your property address, our team is preparing a new
                  evidence package for the new property. We’ll email you the moment
                  it’s ready, well before your filing deadline, and your savings estimate will
                  update here.
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card style={{ background: C.greenDark, border: "none", color: "#fff", minHeight: 214, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
              <div style={{ flex: 1, minWidth: 0, textAlign: "center", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.3, minHeight: 32, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>County assessed value</div>
                <div style={{ fontSize: 21, fontWeight: 700 }}>
                  {money(PROPERTY.assessed)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "center", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.3, minHeight: 32, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>What comps support</div>
                <div style={{ fontSize: 21, fontWeight: 700, color: "#A7F3D0" }}>{money(PROPERTY.target)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "center", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.3, minHeight: 32, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>Estimated savings / yr</div>
                <div style={{ fontSize: 21, fontWeight: 700, color: "#A7F3D0" }}>
                  ~{money(PROPERTY.estSavings)}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 13.5,
                opacity: 0.92,
                lineHeight: 1.55,
                borderTop: "1px solid rgba(255,255,255,.18)",
                paddingTop: 14,
              }}
            >
              Your comps strongly support a {money(reduction)} reduction, and that’s the
              case you’ll be filing. We’ve done the analysis, you’ll submit it.
            </div>
          </Card>
        )}

        <Card style={{ marginTop: 16, padding: 18, opacity: rebuilding ? 0.55 : 1 }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
            Your case file{rebuilding ? " (updating for your new address)" : ""}
          </div>
          <div>
            <Field label="Folio" value={rebuilding ? "Updating…" : PROPERTY.folio} />
            <Field label="Owner" value={PROPERTY.owner} />
            <Field label="Tax year" value="2026" />
            <Field label="County" value={rebuilding ? "Updating…" : PROPERTY.county} last />
          </div>
        </Card>

        {/* Deadline reveal, turns "I paid" into "I have a date and a plan" */}
        <Card style={{ marginTop: 16, borderColor: C.amberLine, background: C.amberSoft, opacity: rebuilding ? 0.55 : 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, color: C.amber, fontWeight: 600 }}>Your filing deadline</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>
                {edge.preTrim ? "~" : ""}{PROPERTY.filingDeadline}
              </div>
              <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>
                {edge.preTrim
                  ? "Estimated, confirmed once your TRIM notice arrives"
                  : `${daysLeft} days left to file`}
              </div>
            </div>
            <Btn full onClick={() => go("action")} disabled={rebuilding}>Go to my Action Center →</Btn>
          </div>
          {rebuilding && (
            <div style={{ fontSize: 12.5, color: C.amber, marginTop: 12, lineHeight: 1.5 }}>
              You can continue once your evidence package is rebuilt for the new address.
            </div>
          )}
        </Card>

        {/* Demo control, toggles the address-changed rebuilding state */}
        <div
          style={{
            marginTop: 26,
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
            padding: "12px 16px",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, fontWeight: 600 }}>
            Demo controls
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Toggle
              label="Show rebuilding state (homeowner changed address)"
              on={rebuilding}
              onClick={() => setRebuilding(!rebuilding)}
            />
            <Toggle
              label="Show estimated deadline"
              on={edge.preTrim}
              onClick={() => setEdge({ ...edge, preTrim: !edge.preTrim })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 4, Action center (state-gated checklist + deadline + banners)
// ===========================================================================

// Persistent partial-payment reminder. This is the single most catastrophic
// failure mode (a won appeal auto-denied for non-payment), so it's a standing
// card once filed, not a hidden edge case. In production the emphasis would
// escalate by date as the tax bill nears; here it's always visible after filing.
function PartialPayReminder() {
  return (
    <Card style={{ marginTop: 16, marginBottom: 24, borderColor: C.amberLine, background: C.amberSoft }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            Pay your tax bill to keep your appeal alive
          </div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>
            Filing doesn't pause your tax bill. When it arrives in November, pay the required amount before it's delinquent (generally March 31), or your petition is denied even if you'd win. We'll remind you well before the cutoff.
          </div>
        </div>
      </div>
    </Card>
  );
}

function ActionCenter({ go, progress, setProgress, edge, setEdge, unread }) {
  // Phase-aware status line for the tracker card once the petition is filed.
  // Walks the same lifecycle as the checklist and emails.
  const phaseStatus = (() => {
    if (!progress.filed) return null;
    if (progress.closed) return { label: "Appeal complete", sub: "Your reduction is final", pct: 100 };
    if (progress.logged) return { label: "Waiting for ratification", sub: "The Board finalizes your reduction at a public meeting", pct: 90 };
    if (progress.prepared) return { label: "Waiting for the magistrate's recommendation", sub: "It arrives by mail, usually within about 20 days", pct: 75 };
    if (!edge.hearingSet) return { label: "Waiting for your hearing date", sub: "The county schedules it after you file the petition", noBar: true };
    // Hearing is set: show the date and drive the bar toward the PA-evidence deadline.
    if (!progress.evidence) return { label: "Your hearing is set for " + PROPERTY.hearingDate, sub: "Next: submit your evidence to the Property Appraiser, due " + HEARING_DATES.track1, pct: 45 };
    return { label: "Your hearing is set for " + PROPERTY.hearingDate, sub: "Your evidence is in. Next, prepare for your hearing.", pct: 60 };
  })();
  const steps = [
    {
      key: "file",
      n: 1,
      title: "File your petition",
      desc: "Submit your petition to the Value Adjustment Board (VAB)",
      target: "file",
      done: progress.filed,
      locked: edge.preTrim,
    },
    {
      key: "evidence",
      n: 2,
      title: "Submit your evidence",
      desc: "Upload your evidence for the Property Appraiser and Magistrate",
      target: "evidence",
      done: progress.evidence,
      locked: !progress.filed,
      lockedNote: "Unlocks once you've filed your petition",
    },
    {
      key: "hearing",
      n: 3,
      title: "Prepare for your hearing",
      desc: "We’ll notify you the moment the county sets your date",
      target: "hearing",
      done: progress.prepared,
      locked: !progress.evidence,
      lockedNote: "Unlocks once your evidence is submitted",
    },
    {
      key: "result",
      n: 4,
      title: "Track your status",
      desc: "Follow your appeal through to the final result and any refund",
      target: "status",
      done: progress.closed,
      locked: !progress.prepared,
      lockedNote: "Unlocks once you've prepared for your hearing",
    },
  ];

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
          Action Center
        </div>
        <PropertyBanner />
        {/* Resume / where-you-left-off, the connective tissue for a months-long,
            fragmented journey. Names the single next action and deep-links to it. */}
        {(() => {
          if (progress.logged) return null; // handled by the done-summary below

          // No confirmed deadline yet: the petition window hasn't opened, so
          // there's nothing to start. Explain and reassure instead of nudging.
          if (edge.preTrim) {
            return (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                  The appeal process hasn't started yet
                </div>
                <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.55, fontWeight: 600, marginBottom: 6 }}>
                  The county hasn't mailed TRIM notices for 2026 yet, so the petition window isn't open.
                </div>
                <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6 }}>
                  There's nothing you need to do right now. We're watching for the county's notice to open up the appeal process. We'll email you the moment the notices are mailed, lock in your exact filing deadline, and unlock your steps below so you can start.
                </div>
              </div>
            );
          }

          const next = steps.find((s) => !s.done && !s.locked);
          if (!next) return null;
          const nextCopy = {
            file: {
              line: "Your next step is to file your petition. It takes a few minutes and your deadline is Sep 19.",
              cta: "File my petition",
            },
            evidence: {
              line: "You've filed. Next: submit your evidence to both places before your deadlines.",
              cta: "Submit my evidence",
            },
            hearing: {
              line: "Evidence is in. Next: get ready for your hearing so you know exactly what to say.",
              cta: "Prepare for my hearing",
            },
            status: {
              line: "Your hearing's done. Follow your appeal through to the final result and any refund.",
              cta: "Track my status",
            },
          }[next.target];
          if (!nextCopy) return null;
          return (
            <div
              style={{
                background: "#fff",
                border: `1px solid ${C.green}`,
                borderRadius: 14,
                padding: "16px 18px",
                marginBottom: 18,
                boxShadow: "0 4px 16px rgba(14,159,110,.10)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                Welcome back, {PROPERTY.owner.split(" ")[0]}
              </div>
              <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.55, fontWeight: 600, marginBottom: 12 }}>
                {nextCopy.line}
              </div>
              <button
                onClick={() => go(next.target)}
                style={{
                  background: C.green,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {nextCopy.cta} →
              </button>
            </div>
          );
        })()}

        {/* Partial-payment reminder, surfaced near the top since it's the most
            catastrophic thing a homeowner can miss. */}
        {progress.filed && !progress.closed && <PartialPayReminder />}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 24, color: C.ink, margin: 0, lineHeight: 1.1 }}>{progress.closed ? "2026 appeal complete" : "Your appeal, step by step"}</h2>
          <span style={{ fontSize: 13, color: C.muted, whiteSpace: "nowrap", paddingBottom: 2 }}>2026 tax year</span>
        </div>

        {/* Deadline tracker, once results are logged, this becomes a done summary. */}
        {progress.logged ? (
          (() => {
            const reduced = progress.loggedOutcome === "reduced" && progress.loggedValue;
            const ratePerDollar = PROPERTY.estSavings / (PROPERTY.assessed - PROPERTY.target);
            const saved = reduced
              ? Math.round((PROPERTY.assessed - progress.loggedValue) * ratePerDollar)
              : 0;
            return (
              <Card style={{ marginBottom: 16, padding: 18, minHeight: 148, display: "flex", flexDirection: "column", justifyContent: "center", background: reduced ? C.greenDark : "#fff", border: reduced ? "none" : `1px solid ${C.line}`, color: reduced ? "#fff" : C.ink }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: reduced ? 14 : 8, textAlign: "center" }}>
                  <span style={{ fontSize: 20, color: reduced ? "#fff" : C.green }}>{reduced ? "🎉" : "✓"}</span>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>
                    {reduced
                      ? `Congratulations, you saved ~${money(saved)} this year!`
                      : "You’re done with your 2026 appeal"}
                  </span>
                </div>
                {reduced ? (
                  <>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 100, textAlign: "center" }}>
                        <div style={{ fontSize: 12.5, opacity: 0.8 }}>Original value</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{money(PROPERTY.assessed)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 100, textAlign: "center" }}>
                        <div style={{ fontSize: 12.5, opacity: 0.8 }}>New value</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#A7F3D0" }}>{money(progress.loggedValue)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 100, textAlign: "center" }}>
                        <div style={{ fontSize: 12.5, opacity: 0.8 }}>Assessment reduced by</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#A7F3D0" }}>{money(PROPERTY.assessed - progress.loggedValue)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.55, textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.18)" }}>
                      Your work here is done for the year. We’ll keep watching your assessment, and when next year’s cycle starts, we’ll tell you whether it’s worth appealing again.
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55, textAlign: "left" }}>
                    The value wasn’t reduced this year, but thanks to our{" "}
                    <span style={{ color: C.greenDark, fontWeight: 600 }}>Results Guarantee</span>,
                    next year’s appeal is on us. We’ll keep monitoring your assessment and
                    reach out when it’s worth filing again.
                  </div>
                )}
              </Card>
            );
          })()
        ) : (
          (() => {
          const urgent = daysLeft <= 2;
          const soon = daysLeft <= 12;
          const tone = urgent
            ? { bg: C.redSoft, line: C.redLine, accent: C.red, bar: C.red }
            : soon
            ? { bg: C.amberSoft, line: C.amberLine, accent: C.amber, bar: C.amber }
            : { bg: C.greenSofter, line: C.line, accent: C.greenDark, bar: C.green };
          return (
            <Card
              style={{
                marginBottom: 16,
                padding: 18,
                background: edge.preTrim ? "#F4F6F5" : tone.bg,
                borderColor: edge.preTrim ? C.line : tone.line,
              }}
            >
              {edge.preTrim ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: C.muted, marginBottom: 4 }}>
                      No deadline yet
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                      Your county hasn’t opened the appeal window (estimated ~{PROPERTY.filingDeadline}). We’ll notify you the moment you can start your petition and walk you through your first step.
                    </div>
                  </div>
                  <div style={{ height: 8, background: "rgba(0,0,0,.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: "0%", height: "100%", background: C.muted, borderRadius: 99 }} />
                  </div>
                </>
              ) : phaseStatus ? (
                <>
                  <div style={{ marginBottom: phaseStatus.noBar ? 0 : 12 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                      {phaseStatus.label}
                    </div>
                    <div style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
                      {phaseStatus.sub}
                    </div>
                  </div>
                  {!phaseStatus.noBar && (
                    <div style={{ height: 8, background: "rgba(0,0,0,.06)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: (phaseStatus.pct || 50) + "%", height: "100%", background: C.green, borderRadius: 99, transition: "width .6s ease" }} />
                    </div>
                  )}
                </>
              ) : (
              <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: tone.accent, lineHeight: 1 }}>
                    {daysLeft}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: tone.accent }}>
                    days left to file
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>
                    Deadline {PROPERTY.filingDeadline}
                  </div>
                </div>
              </div>
              <div style={{ height: 8, background: "rgba(0,0,0,.06)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${windowPct}%`,
                    height: "100%",
                    background: tone.bar,
                    borderRadius: 99,
                    transition: "width .6s ease",
                  }}
                />
              </div>
              </>
              )}
            </Card>
          );
        })()
        )}

        {/* Evidence package, one persistent asset */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.greenSofter,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                Your evidence package is ready
              </div>
              <div style={{ fontSize: 12.5, color: C.muted }}>
                Comps, valuation summary and cover sheet (PDF)
              </div>
            </div>
          </div>
          <Btn variant="soft" small onClick={downloadEvidencePackage}>
            Download
          </Btn>
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button
            onClick={() => go("documents")}
            style={{ background: "none", border: "none", color: C.greenDark, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 4 }}
          >
            View all documents →
          </button>
        </div>

        {/* State-gated checklist, connected bubble stepper */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {steps.map((s, i) => (
            <ChecklistRow key={s.key} step={s} isFirst={i === 0} isLast={i === steps.length - 1} onOpen={() => !s.locked && go(s.target)} />
          ))}
        </div>

        {/* Demo controls */}
        <DemoBar edge={edge} setEdge={setEdge} progress={progress} setProgress={setProgress} />
      </div>
    </div>
  );
}

function ChecklistRow({ step, onOpen, isLast, isFirst }) {
  const { done, locked } = step;
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
      {/* rail: line above + centered numbered circle + line below */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 34 }}>
        <div style={{ width: 2, flex: 1, background: isFirst ? "transparent" : (done ? C.green : C.line) }} />
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            flexShrink: 0,
            background: done ? C.green : locked ? "#EEF1EF" : C.greenSoft,
            color: done ? "#fff" : locked ? C.muted : C.greenDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {done ? "✓" : locked ? "🔒" : step.n}
        </div>
        <div style={{ width: 2, flex: 1, background: isLast ? "transparent" : (done ? C.green : C.line) }} />
      </div>
      {/* card */}
      <div
        onClick={onOpen}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#fff",
          border: `1px solid ${done ? C.green : C.line}`,
          borderRadius: 14,
          padding: 16,
          marginTop: 7,
          marginBottom: 7,
          cursor: locked ? "default" : "pointer",
          opacity: locked ? 0.55 : 1,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink }}>{step.title}</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {locked && step.lockedNote ? step.lockedNote : step.desc}
          </div>
        </div>
        {locked ? (
          <span style={{ color: C.muted, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
            Locked
          </span>
        ) : done ? (
          <span style={{ color: C.green, fontSize: 14, fontWeight: 600 }}>Done</span>
        ) : (
          <span
            style={{
              background: C.green,
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 9,
              whiteSpace: "nowrap",
            }}
          >
            Start →
          </span>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 5, File petition (annotated pre-flight briefing)
// ===========================================================================
function FilePetition({ go, back, progress, setProgress, unread }) {
  const [copied, setCopied] = useState("");
  const copy = (label, val) => {
    copyToClipboard(val);
    setCopied(label); // persists until a different field is copied
  };
  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <BackLink back={back} />
          <Pill tone="gray">Step 1 · File Petition</Pill>
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "0 0 6px" }}>
          File your VAB petition
        </h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 16px" }}>
          You’ll file form DR-486 on the Miami-Dade VAB portal. We’ve broken it into simple
          steps and pre-filled your details so it’s quick to get through.
        </p>
        <PropertyBanner />

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 }}>
            What you’ll do on the county site
          </div>
          {(() => {
            const steps = [
              "Click \u201cOpen Miami-Dade VAB Portal\u201d below, then \u201cClick to Begin Filing A Petition Now.\u201d Read the welcome page and click \u201cI Agree and Wish to Continue.\u201d",
              "Enter your Parcel/Folio # (below) in the \u201cParcel Number\u201d field. Most of your information fills in automatically.",
              "Review the auto-filled information, fix anything wrong, then pick your Property Type from the dropdown.",
              "In the Petitioner Type dropdown, select \u201cTaxPayer.\u201d",
              "Enter your mailing and email address, and choose email as your contact preference. It's faster and it's how you'll get your hearing notice.",
              "For your appeal reason, check \u201cReal Property Value,\u201d then select \u201cDecrease.\u201d",
              "In PART 3, do NOT check the \u201cauthorize the person I appointed in PART 5\u201d box (that's for hiring a representative). Just type your name in the Tax Payer Name box.",
              "Skip PART 4 and PART 5.",
              "Tell the portal how long you'll need to present (we suggest 15 minutes) and mark any dates you can't attend.",
              "To attend remotely, check \u201cI will attend virtually by WebEx.\u201d Do NOT check \u201cWill Not Attend Hearing,\u201d as skipping it hurts your chances.",
              "E-sign, click Submit, and pay the $15 filing fee by card. Your petition isn't filed until the fee is paid.",
            ];
            const StepRow = (t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ color: C.green, fontWeight: 700, fontSize: 13, width: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>{t}</span>
              </div>
            );
            const folioChip = (
              <div
                onClick={() => copy("Parcel/Folio #", PROPERTY.folio)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.greenSofter, border: `1px solid ${C.line}`, borderRadius: 9, margin: "4px 0 12px 28px", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: 11.5, color: C.muted }}>Parcel/Folio #</div>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, userSelect: "all", cursor: "text" }}>{PROPERTY.folio}</div>
                </div>
                <span style={{ fontSize: 12.5, color: C.green, fontWeight: 600 }}>{copied === "Parcel/Folio #" ? "Copied ✓" : "Copy"}</span>
              </div>
            );
            return (
              <>
                {StepRow(steps[0], 0)}
                <div style={{ margin: "14px 0 16px", display: "flex", justifyContent: "center" }}>
                  <a href="https://vabprod.miamidade.gov/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <Btn variant="dark" small>Open Miami-Dade VAB portal ↗</Btn>
                  </a>
                </div>
                {StepRow(steps[1], 1)}
                {folioChip}
                {StepRow(steps[2], 2)}
                {steps.slice(3).map((t, i) => StepRow(t, i + 3))}
              </>
            );
          })()}
        </Card>

        {/* Self-attest gate + optional upload */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
            Once you’ve filed
          </div>
          <p style={{ fontSize: 13.5, color: C.body, margin: "0 0 14px", lineHeight: 1.5 }}>
            Mark this done to unlock your evidence step. We’ll confirm the filing against the
            county’s public record in the background.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Btn
              small
              onClick={() => {
                setProgress({ ...progress, filed: true });
                go("action");
              }}
            >
              I’ve filed my petition
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 6, Submit evidence (the AXIA dual-track screen)
// ===========================================================================
function SubmitEvidence({ go, back, progress, setProgress, edge, setEdge, unread }) {
  const [trackA, setTrackA] = useState(false);
  const [trackB, setTrackB] = useState(false);
  const [copiedField, setCopiedField] = useState(null); // "to" | "subject" | "body"
  const [emailOpen, setEmailOpen] = useState(false); // email-template accordion under the alternative step

  // Both real actions must be confirmed for the step to count as done: the
  // upload to the Property Appraiser, then the transfer to AXIA.
  useEffect(() => {
    if (trackA && trackB && setProgress) {
      setProgress((p) => (p.evidence ? p : { ...p, evidence: true }));
    }
  }, [trackA, trackB]);

  // This page has its own demo stepper (at the bottom) that walks through the
  // evidence timeline, so the relevant states are driven locally rather than by
  // the Action Center toggles.
  // stage 1: no hearing date yet  · 2: date assigned, deadlines locked in
  //       3: Track 1 (PA) due soon · 4: Track 1 (PA) exchange past due
  //       5: Track 2 (AXIA) due soon · 6: AXIA past due
  const [stage, setStage] = useState(edge.hearingSet ? 2 : 1);
  const ev = {
    hearingSet: stage >= 2,
    dueSoonPA: stage === 3,
    missedPA: stage === 4,
    dueSoonAxia: stage === 5,
    missedAxia: stage === 6,
  };
  // Keep the global hearing-set flag in sync so the Action Center card reflects
  // the scheduled hearing (date + progress toward the PA-evidence deadline).
  useEffect(() => {
    if (setEdge) setEdge((e) => (e.hearingSet === (stage >= 2) ? e : { ...e, hearingSet: stage >= 2 }));
  }, [stage]);

  const SUBJECT = `VAB Evidence Exchange, Folio ${PROPERTY.folio}, Petition ${"[YOUR PETITION NUMBER]"}`;

  // The petition / transaction number comes from the homeowner's filing receipt,
  // so it's the one field they fill in themselves (shown as a green placeholder).
  const petitionPart = "[YOUR PETITION NUMBER]";

  const EMAIL_TEMPLATE = `Dear Miami-Dade Property Appraiser's Office,

Please find attached my mandatory evidence submission for the upcoming Value Adjustment Board (VAB) hearing regarding the following property:

Property Owner Name: ${PROPERTY.owner}
Subject Property Address: ${PROPERTY.address}, ${PROPERTY.cityLine}
Folio Number: ${PROPERTY.folio}
VAB Petition Number: ${petitionPart}
Hearing Date: ${"[Date of your hearing, if scheduled]"}

Thank you,
${PROPERTY.owner}`;

  // Persistent copy: whichever was copied last stays marked until another is clicked.
  const doCopy = (field, text) => {
    copyToClipboard(text);
    setCopiedField(field);
  };

  // Renders the email body with [PLACEHOLDERS] bolded
  const renderTemplate = () =>
    EMAIL_TEMPLATE.split(/(\[[^\]]+\])/g).map((part, i) =>
      part.startsWith("[") ? (
        <strong key={i} style={{ color: C.green, fontWeight: 700 }}>
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  const Track = ({ tone, badge, num, title, deadline, missed, desc, steps, template, portalLabel, portalUrl, done, setDone, submitLabel, doneLabel }) => {
    const emailBlock = (
      <>
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 10,
            fontSize: 12.5,
            lineHeight: 1.7,
            color: C.ink,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <span style={{ color: C.muted, fontWeight: 600 }}>To:&nbsp;</span>
              <span style={{ fontWeight: 600 }}>pavabsubmission@mdcpa.net</span>
            </div>
            <button
              onClick={() => doCopy("to", "pavabsubmission@mdcpa.net")}
              style={{
                flexShrink: 0, width: 78, textAlign: "center",
                background: copiedField === "to" ? C.green : "#fff",
                color: copiedField === "to" ? "#fff" : C.green,
                border: `1px solid ${copiedField === "to" ? C.green : C.line}`,
                borderRadius: 7, padding: "4px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {copiedField === "to" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <span style={{ color: C.muted, fontWeight: 600 }}>Subject:&nbsp;</span>
              <span style={{ fontWeight: 600 }}>{SUBJECT}</span>
            </div>
            <button
              onClick={() => doCopy("subject", SUBJECT)}
              style={{
                flexShrink: 0, width: 78, textAlign: "center",
                background: copiedField === "subject" ? C.green : "#fff",
                color: copiedField === "subject" ? "#fff" : C.green,
                border: `1px solid ${copiedField === "subject" ? C.green : C.line}`,
                borderRadius: 7, padding: "4px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {copiedField === "subject" ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: C.greenSofter, padding: "8px 12px", borderBottom: `1px solid ${C.line}`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Message body
            </span>
            <button
              onClick={() => doCopy("body", EMAIL_TEMPLATE)}
              style={{
                flexShrink: 0, width: 78, textAlign: "center",
                background: copiedField === "body" ? C.green : "#fff",
                color: copiedField === "body" ? "#fff" : C.green,
                border: `1px solid ${copiedField === "body" ? C.green : C.line}`,
                borderRadius: 7, padding: "4px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {copiedField === "body" ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              margin: 0, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.65,
              color: C.ink, whiteSpace: "pre-wrap", fontFamily: "inherit",
            }}
          >
            {renderTemplate()}
          </pre>
        </div>
      </>
    );
    return (
    <Card
      style={{
        padding: 20,
        borderColor: missed ? C.redLine : done ? C.green : C.line,
        background: missed ? C.redSoft : "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: done ? C.green : tone === "blue" ? C.blueSoft : C.amberSoft,
              color: done ? "#fff" : tone === "blue" ? C.blue : C.amber,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {done ? "✓" : num}
          </div>
          <Pill tone={tone}>{badge}</Pill>
        </div>
        {missed ? <Pill tone="red">Past due</Pill> : null}
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: missed ? C.red : C.body,
          fontWeight: 600,
          marginBottom: 12,
          background: missed ? "transparent" : C.greenSofter,
          border: missed ? "none" : `1px solid ${C.line}`,
          borderRadius: 7,
          padding: missed ? 0 : "5px 9px",
          alignSelf: "flex-start",
        }}
      >
        🕑 {deadline}
      </div>

      <p style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55, margin: "0 0 12px" }}>{desc}</p>
      <div style={{ marginBottom: 14 }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>{s}</span>
            </div>
            {/* Email template accordion sits under the "Alternative: email" step (index 1) */}
            {template && i === 1 && (
              <div style={{ margin: "2px 0 12px 22px", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setEmailOpen((v) => !v)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: emailOpen ? C.greenSofter : "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                >
                  <span style={{ fontSize: 14 }}>✉️</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: C.ink }}>Pre-written email (tap to copy the address, subject and message)</span>
                  <span style={{ fontSize: 13, color: C.muted, flexShrink: 0 }}>{emailOpen ? "▾" : "▸"}</span>
                </button>
                {emailOpen && (
                  <div style={{ padding: "12px 12px 14px", borderTop: `1px solid ${C.line}` }}>
                    {emailBlock}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: 260 }}>
            <Btn small variant="dark" full>
              {portalLabel} ↗
            </Btn>
          </a>
        )}
        <div style={{ width: 260 }}>
          <Btn small variant={done ? "soft" : "primary"} full onClick={() => setDone(true)}>
            {done ? (doneLabel || "✓ Done") : (submitLabel || "Mark as submitted")}
          </Btn>
        </div>
      </div>
    </Card>
    );
  };

  const bothDone = trackA && trackB;

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <BackLink back={back} />
          <Pill tone="gray">Step 2 · Submit Evidence</Pill>
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "0 0 6px" }}>
          Submit your evidence
        </h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 8px" }}>
          Your evidence has to reach two offices: the <strong>Property Appraiser</strong> and the{" "}
          <strong>Special Magistrate</strong>. The good news is the
          county's Exchange Portal can do both. We track the deadlines so you don’t miss either.
        </p>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
          Download the evidence package in your Action Center if you haven’t already as you’ll
          need it for this step.
        </div>

        <PropertyBanner />

        {ev.dueSoonPA && !trackA && (
          <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, color: C.ink, lineHeight: 1.5, marginBottom: 16 }}>
            <strong style={{ color: C.amber }}>Your evidence for the Property Appraiser is due soon.</strong> The
            exchange with the Property Appraiser is due 15 days before your hearing. Submitting
            on time protects your right to present your evidence at the hearing, so upload it soon.
          </div>
        )}

        {ev.missedPA && !trackA && (
          <div style={{ background: C.redSoft, border: `1px solid ${C.redLine}`, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, color: C.ink, lineHeight: 1.5, marginBottom: 16 }}>
            <strong style={{ color: C.red }}>Your evidence exchange with the Property Appraiser is past due.</strong> It's
            late but don't skip it, upload it now anyway. A late exchange doesn't automatically
            throw out your case, and your evidence isn't necessarily inadmissible.
          </div>
        )}

        {ev.dueSoonAxia && !trackB && (
          <div style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}`, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, color: C.ink, lineHeight: 1.5, marginBottom: 16 }}>
            <strong style={{ color: C.amber }}>Your AXIA transfer is due by 9:00 AM tomorrow.</strong>{" "}
            This is the deadline most people miss. If your evidence isn’t in AXIA, the Special
            Magistrate may never see it. Make sure you completed the Transfer to Axia step so you’re covered.
          </div>
        )}

        {ev.missedAxia && !trackB && (
          <div style={{ background: C.redSoft, border: `1px solid ${C.redLine}`, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, color: C.ink, lineHeight: 1.5, marginBottom: 16 }}>
            <strong style={{ color: C.red }}>Your AXIA transfer is past due.</strong>{" "}
            It’s late, but not necessarily too late: the Special Magistrate can still choose to
            consider it. Complete the transfer now anyway, and keep a copy in front of you at your
            hearing so you can walk through it.
          </div>
        )}

        {/* Hearing-not-yet-scheduled note, deadlines are relative until the county sets a date */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: ev.hearingSet ? C.greenSofter : C.blueSoft,
            border: `1px solid ${ev.hearingSet ? C.green : C.line}`,
            borderRadius: 10,
            padding: "11px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: C.ink,
            lineHeight: 1.5,
          }}
        >
          <span>📅</span>
          {ev.hearingSet ? (
            <span>
              <strong style={{ color: C.greenDark }}>Your hearing is set for {PROPERTY.hearingDate}.</strong>{" "}
              We detected it on the county portal and locked in your exact evidence deadlines
              below. We’ll remind you before each one is due.
            </span>
          ) : (
            <span>
              Your hearing date hasn’t been assigned yet. The county schedules it after you
              file the petition. Both deadlines below are tied to that date, so we show them as “before your
              hearing” for now and will lock in exact dates (and remind you) the moment your
              hearing is set.
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20, borderColor: trackA ? C.green : C.line }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
              Upload your evidence
            </div>
            <p style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55, margin: "0 0 14px" }}>
              You'll do this in one place, the county's VAB Taxpayer Representative Exchange Portal.
              First you upload your package for the Property Appraiser, then a single button transfers
              the same files to AXIA for the Special Magistrate. Two deadlines, one portal.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <a href="https://apps.miamidadepa.gov/PAOnlineTools/RegistrationPortalClient/#/sign-in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: 260 }}>
                <Btn variant="dark" small full>Open the Exchange Portal ↗</Btn>
              </a>
            </div>

            {/* Section A, Property Appraiser exchange */}
            <div style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Part 1 · Property Appraiser
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: C.blue, background: C.blueSoft, border: `1px solid ${C.line}`, padding: "3px 10px", borderRadius: 999 }}>
                  {ev.hearingSet ? `Due ${HEARING_DATES.track1}` : "Due 15 days before your hearing"}
                </span>
              </div>
              {[
                <>After you file your petition, the county emails you an invitation to activate your Exchange Portal account. Open that email and click the activation link to get started.</>,
                <>On the portal, review your contact information, then click <strong>Update Contact</strong> to begin activating your account.</>,
                <>Create a <strong>Username</strong> (at least 8 characters). When it shows as available, you'll be prompted to set a password.</>,
                <>Create a <strong>Password</strong> (at least 8 characters, with uppercase, lowercase, and at least one special character), then confirm it. Click <strong>Activate Account</strong>, then <strong>Sign-In</strong> and log in with your new credentials.</>,
                <>On the <strong>Petition Selection</strong> page, find your petition (you can filter by Unscheduled, Unheard, Heard, or All), then click to select it. This enables the <strong>Upload Evidence</strong> button.</>,
                <>Click <strong>Upload Evidence</strong>, then drag your PDF into the upload area or click <strong>Select files...</strong> to choose it. Click the blue <strong>Upload</strong> button to submit.</>,
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: C.blue, fontWeight: 700, fontSize: 13, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 6px" }}>
                <div style={{ width: 260 }}>
                  <Btn
                    small
                    full
                    variant={trackA ? "soft" : "primary"}
                    onClick={() => setTrackA(true)}
                  >
                    {trackA ? "✓ Uploaded to Property Appraiser" : "I've uploaded to the Property Appraiser"}
                  </Btn>
                </div>
              </div>
            </div>

            {/* Section B, Transfer to AXIA */}
            <div style={{ borderLeft: `3px solid ${C.green}`, paddingLeft: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.greenDark, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Part 2 · Special Magistrate
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: C.greenDark, background: C.greenSoft, border: `1px solid ${C.line}`, padding: "3px 10px", borderRadius: 999 }}>
                  {ev.hearingSet ? `Due 9:00 AM ${HEARING_DATES.track2}` : "Due 9:00 AM the day before your hearing"}
                </span>
              </div>
              {[
                <>After your upload completes, the portal shows a <strong>PA Upload Completed</strong> message and prompts you to transfer the evidence to AXIA.</>,
                <>In the <strong>AXIA Transfer</strong> window, select your petition and the evidence you want to move (there are <strong>Select All</strong> buttons for both lists).</>,
                <>Click the green <strong>Transfer to Axia</strong> button to copy the files into AXIA for the Special Magistrate. You'll get an email receipt confirming the transfer.</>,
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: C.greenDark, fontWeight: 700, fontSize: 13, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 6px" }}>
                <div style={{ width: 260 }}>
                  <Btn
                    small
                    full
                    variant={trackB ? "soft" : "primary"}
                    disabled={!trackA}
                    onClick={() => setTrackB(true)}
                  >
                    {trackB ? "✓ Transferred to AXIA" : !trackA ? "Upload to the PA first" : "I've transferred to AXIA"}
                  </Btn>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 300 }}>
            <Btn
              full
              disabled={!bothDone}
              onClick={() => {
                setProgress({ ...progress, evidence: true });
                go("action");
              }}
            >
              {bothDone ? "Back to Action Center" : "Upload your evidence to continue"}
            </Btn>
          </div>
        </div>

        {/* demo stepper, walks the evidence timeline */}
        <div style={{ marginTop: 24, border: `1px dashed ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 600 }}>
            Demo control, walk the evidence timeline
          </div>
          <div style={{ fontSize: 12.5, color: C.body, marginBottom: 10, lineHeight: 1.5 }}>
            {[
              "No hearing date yet, deadlines show as relative",
              "Hearing date assigned, exact deadlines lock in",
              "Evidence exchange (Property Appraiser) due soon",
              "Evidence exchange past due (late, but still upload to AXIA)",
              "AXIA upload due by 9 AM tomorrow",
              "AXIA upload past due",
            ][stage - 1]}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setStage((s) => Math.max(1, s - 1))}
              disabled={stage === 1}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff", color: stage === 1 ? C.muted : C.ink, fontSize: 13, cursor: stage === 1 ? "default" : "pointer", fontWeight: 600, opacity: stage === 1 ? 0.5 : 1 }}
            >
              ← Earlier
            </button>
            <span style={{ fontSize: 12.5, color: C.body, minWidth: 90, textAlign: "center" }}>
              Stage {stage} of 6
            </span>
            <button
              onClick={() => setStage((s) => Math.min(6, s + 1))}
              disabled={stage === 6}
              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: stage === 6 ? "#CBD3CE" : C.green, color: "#fff", fontSize: 13, cursor: stage === 6 ? "default" : "pointer", fontWeight: 600 }}
            >
              Advance →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 7, Prepare for hearing
// ===========================================================================
function PrepareHearing({ go, back, progress, setProgress, edge, unread }) {
  // By the time the homeowner reaches this step, the hearing date is set (evidence
  // can only be uploaded once a hearing exists), so this page always shows the
  // scheduled state.
  const hp = { hearingSet: true };
  const faqs = [
    ["What if the appraiser disagrees?", "They’ll present their own comps. Stick to your evidence, your package was built to withstand this."],
    ["Do I need a lawyer?", "No. VAB hearings are designed for homeowners to represent themselves."],
    ["How long does it take?", "Most hearings run 15–20 minutes. You present, they respond, and the magistrate later mails a recommendation."],
  ];
  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <BackLink back={back} />
          <Pill tone="gray">Step 3 · Prepare for Hearing</Pill>
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "0 0 6px" }}>
          {hp.hearingSet
            ? `Your hearing is set for ${PROPERTY.hearingDate}`
            : "Get ready for your hearing"}
        </h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
          {hp.hearingSet
            ? "You’ve got this. A hearing is short and follows a predictable order. Here’s exactly what to expect and say."
            : "Your hearing date hasn’t been set yet, the county schedules it after you file the petition, and we’ll notify you the moment it’s assigned. In the meantime, here’s exactly what to expect and say."}
        </p>
        <PropertyBanner />

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            How the hearing flows
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>
            Hearings are informal and follow this same order every time.
          </div>
          {[
            ["You present first", "Walk through your evidence package: your home vs. recent comparable sales."],
            ["The appraiser responds", "They may present their own data. Stay calm and factual."],
            ["The magistrate makes a recommendation", "You won't get a decision at the hearing. You'll receive a written recommendation by mail, usually within about 20 days."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: C.greenSoft,
                  color: C.greenDark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{t}</div>
                <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ marginBottom: 16, borderColor: C.greenSoft }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
            Your 30-second opening script
          </div>
          <div
            style={{
              background: C.greenSofter,
              borderRadius: 10,
              padding: 14,
              fontSize: 14,
              color: C.body,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            “Good morning. I’m appealing the assessed value of {PROPERTY.address}. The
            county assessed it at {money(PROPERTY.assessed)}, but recent comparable sales
            in my neighborhood support a value of about {money(PROPERTY.target)}. My
            evidence package shows three comparable homes that sold below my assessment.”
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 13.5 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: C.greenDark, marginBottom: 4 }}>✓ Do</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.body, lineHeight: 1.55, listStyleType: "disc" }}>
                <li>Lead with your value and your comparable sales.</li>
                <li>Bring your evidence package and refer to it.</li>
                <li>Stay calm and factual, even if the appraiser pushes back.</li>
                <li>Answer the question asked, then stop.</li>
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: C.red, marginBottom: 4 }}>✗ Don’t</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.body, lineHeight: 1.55, listStyleType: "disc" }}>
                <li>Argue you can’t afford the taxes, that’s not what they decide.</li>
                <li>Bring up your mortgage, income, or personal hardship.</li>
                <li>Get into an argument or talk over the appraiser.</li>
                <li>Introduce brand-new evidence you didn’t submit.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
            Quick FAQ
          </div>
          {faqs.map(([q, a], i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < faqs.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{q}</div>
              <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{a}</div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn full variant="ghost" onClick={downloadHearingPacket}>
            Download hearing-day packet (PDF)
          </Btn>
          <Btn
            full
            onClick={() => {
              setProgress({ ...progress, prepared: true });
              go("action");
            }}
          >
            I’m ready for my hearing
          </Btn>
        </div>
      </div>
    </div>
  );
}


// ---- shared back link ------------------------------------------------------
function BackLink({ back }) {
  return (
    <button
      onClick={back}
      style={{
        background: "none",
        border: "none",
        color: C.muted,
        fontSize: 13.5,
        cursor: "pointer",
        padding: 0,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      ← Back
    </button>
  );
}

// ===========================================================================
// SCREEN, Post-hearing status tracker
// The honest design: auto-update the stages we can read from county systems,
// prompt the homeowner for the stages we can't. Each stage is tagged with its
// data source so the homeowner (and the product) know what's automated vs. self-reported.
// ===========================================================================
// Self-report value input. Kept at module scope with its OWN local state so
// typing never re-renders the parent StatusTracker (which would remount the
// input and drop mobile keyboard focus on every keystroke).
function SelfReportInput({ isRec, onSubmit }) {
  const [val, setVal] = useState("");
  const valid = val && parseInt(val, 10) > 0;
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>
        {isRec ? "Recommended assessed value (from your letter)" : "Final assessed value (from your VAB decision letter or corrected bill)"}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>$</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="485000"
          style={{
            flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 11px",
            fontSize: 15, fontWeight: 600, color: C.ink, fontFamily: "inherit",
            outline: "none", background: "#fff", minWidth: 0,
          }}
        />
      </div>
      <button
        onClick={() => { if (valid) onSubmit(parseInt(val, 10)); }}
        disabled={!valid}
        style={{
          background: valid ? C.blue : "#B7C2BC", color: "#fff", border: "none",
          borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700,
          cursor: valid ? "pointer" : "default", width: "100%",
        }}
      >
        {isRec ? "Log my recommendation →" : "Log my final reduction →"}
      </button>
    </div>
  );
}

function StatusTracker({ go, back, progress, setProgress, unread }) {
  const [stage, setStage] = useState(1);
  const [refundPaid, setRefundPaid] = useState(null); // null | true (paid, refund coming) | false (not paid)
  // Some counties file on paper / Excel with no online VAB portal to read, so we
  // can't auto-detect the recommendation or ratification for them. In that case
  // we prompt the homeowner to self-report when their letter arrives. This toggle
  // demonstrates that fallback (auto where we can, prompt where we can't).
  const [paperCounty, setPaperCounty] = useState(false);
  // Win fires when the reduction is final: ratification (auto stage 3) or the
  // logged final reduction (paper stage 3). Closed at the last stage.
  const winStage = 3;
  useEffect(() => {
    if (stage >= winStage && setProgress) {
      setProgress((p) =>
        p.logged
          ? p
          : { ...p, logged: true, loggedOutcome: "reduced", loggedValue: p.loggedValue || PROPERTY.target }
      );
    }
  }, [stage]);
  useEffect(() => {
    const closeAt = paperCounty ? 4 : 5;
    if (stage >= closeAt && setProgress) {
      setProgress((p) => (p.closed ? p : { ...p, closed: true }));
    }
  }, [stage, paperCounty]);
  // stage: 1 awaiting · 2 recommended · 3 ratified (win) · 4 refund · 5 financial close-out
  const autoStages = [
    {
      n: 1,
      key: "awaiting",
      title: "Hearing complete, awaiting recommendation",
      source: "auto",
      statusBadge: "Hearing complete",
      body:
        "Your hearing was Oct 14. Magistrates don't make the final decision in the room. They mail a recommendation usually within about 20 days. There's nothing for you to do right now. We're checking the VAB record for you and will alert you the moment it posts.",
      metaCurrent: "Expected by early November",
      metaDone: null,
    },
    {
      n: 2,
      key: "recommended",
      title: "Magistrate recommended a reduction",
      source: "auto",
      statusBadge: "Recommendation received on Nov 3",
      body:
        "Good news: the magistrate recommended lowering your value from $530,000 to $485,000. This isn't final yet. The VAB has to ratify it at a public meeting before it's official. We'll watch for that and notify you once we see an update.",
      metaCurrent: "Not yet final, the Board still needs to ratify it",
      metaDone: null,
    },
    {
      n: 3,
      key: "ratified",
      title: "The Board ratified your reduction",
      source: "auto",
      statusBadge: "Reduction ratified on Dec 12",
      body:
        "The VAB ratified your reduction at its meeting. Your 2026 assessed value is now officially **$485,000**, down from $530,000, about **$900 less in taxes** this year. Your county will issue a corrected tax bill reflecting the lower value, or a refund if you have already paid. Corrected bills typically follow within a few weeks of ratification; we'll let you know what to expect for your situation below.",
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 4,
      key: "refund",
      title: "If you already paid your tax bill",
      source: "prompt",
      statusBadge: "",
      statusBadgeDone: "Refund reviewed",
      body:
        "You don't need to file anything. Because you already paid your tax bill, the reduction means the county owes you money back, and the refund is issued automatically once the county updates its official tax records. Refunds come from the Miami-Dade County Tax Collector, a different office than the VAB. Here's what to know so it reaches you:",
      refundSteps: [
        "After ratification, the Tax Collector recalculates your bill and issues the refund automatically. Refunds usually arrive within 6 to 8 weeks of the final decision.",
        "Make sure your mailing address on file is current since the refund check is mailed to the owner's address of record (which isn't always the property itself). If it's outdated, update it with the Miami-Dade County Tax Collector, either online at mdctaxcollector.gov or by calling (305) 375-5448.",
        "If your taxes are paid through a mortgage escrow account, the refund goes to whoever paid the bill, usually your lender, who applies it to your escrow.",
        "Questions or no check after 8 weeks? Contact the Miami-Dade County Tax Collector at 200 NW 2nd Avenue, Miami, FL 33128, or call (305) 375-5448, and reference your folio 30-5912-024-0050.",
      ],
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 5,
      key: "done",
      title: refundPaid === false ? "Corrected bill applied" : refundPaid === true ? "Appeal complete" : "Appeal complete",
      source: "prompt",
      statusBadge: "Complete",
      metaCurrent: null,
      metaDone: null,
    },
  ];

  // Paper-filing counties have no online record, so the middle stages are
  // homeowner self-reported (recommendation number, then final reduction).
  const paperStages = [
    {
      n: 1,
      key: "awaiting",
      title: "Hearing complete, awaiting your letter",
      source: "auto",
      statusBadge: "Hearing complete",
      body:
        "Your hearing was Oct 14. Because your county files on paper with no online record, we can't detect your result automatically. The magistrate will mail a recommendation usually within about 20 days. When it arrives, come back and log it below.",
      metaCurrent: "Watch your mail",
      metaDone: null,
    },
    {
      n: 2,
      key: "rec_selfreport",
      title: "Did your recommendation letter arrive?",
      source: "prompt",
      statusBadge: "",
      statusBadgeDone: "Recommendation logged",
      body:
        "When your recommendation letter arrives, enter the recommended assessed value below. This is still provisional. It isn't final until the Board ratifies it but logging it helps us track your case.",
      selfReport: "recommendation",
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 3,
      key: "final_selfreport",
      title: "Log your final reduction",
      source: "prompt",
      statusBadge: "",
      statusBadgeDone: "Final reduction logged",
      body:
        "Once the Board ratifies the reduction, you'll see the final value on your corrected tax bill or refund. Enter that final assessed value below and we'll mark your appeal as complete.",
      selfReport: "final",
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 4,
      key: "ratified",
      title: "Your reduction is final",
      source: "prompt",
      statusBadge: "Reduction logged",
      body:
        "Your reduction is logged. The county will issue a corrected tax bill, or a refund if you've already paid, reflecting the lower value. Let us know which applies to you.",
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 5,
      key: "refund",
      title: "If you already paid your tax bill",
      source: "prompt",
      statusBadge: "",
      statusBadgeDone: "Refund reviewed",
      body:
        "You don't need to file anything. Because you already paid your tax bill, the reduction means the county owes you money back, and the refund is issued automatically once the county updates its official tax records. Refunds come from the Miami-Dade County Tax Collector, a different office than the VAB. Here's what to know so it reaches you:",
      refundSteps: [
        "After ratification, the Tax Collector recalculates your bill and issues the refund automatically. Refunds usually arrive within 6 to 8 weeks of the final decision.",
        "Make sure your mailing address on file is current since the refund check is mailed to the owner's address of record. If it's outdated, update it with the Miami-Dade County Tax Collector, either online at mdctaxcollector.gov or by calling (305) 375-5448.",
        "If your taxes are paid through a mortgage escrow account, the refund goes to whoever paid the bill, usually your lender, who applies it to your escrow.",
        "Questions or no check after 8 weeks? Contact the Miami-Dade County Tax Collector at 200 NW 2nd Avenue, Miami, FL 33128, or call (305) 375-5448, and reference your folio 30-5912-024-0050.",
      ],
      metaCurrent: null,
      metaDone: null,
    },
    {
      n: 6,
      key: "done",
      title: "Appeal complete",
      source: "prompt",
      statusBadge: "Complete",
      body:
        "Congratulations, you're done! That closes out your appeal. Your reduction is logged and your corrected bill or refund reflects it. We'll keep watching your assessment, and when next year's cycle starts, we'll tell you whether it's worth appealing again.",
      metaCurrent: null,
      metaDone: null,
    },
  ];

  const stages = paperCounty ? paperStages : autoStages;
  const lastStage = stages.length;

  const Step = ({ s }) => {
    const done = s.n < stage;
    const current = s.n === stage;
    const future = s.n > stage;
    // The refund step (stage 4) is a "prompt" while current. Stage 5 is the
    // financial close-out, which reads as complete (green), not a prompt.
    const isPrompt = s.source === "prompt" && current && s.key !== "done";
    let badgeText = s.source === "prompt" && done ? (s.statusBadgeDone || s.statusBadge) : s.statusBadge;
    // If the homeowner hadn't paid, the refund step is skipped (no refund due),
    // so don't imply they reviewed a refund.
    if (s.key === "refund" && done && refundPaid === false) badgeText = "No refund due";
    const meta = current ? s.metaCurrent : s.metaDone;
    return (
      <div style={{ display: "flex", gap: 12, opacity: future ? 0.45 : 1 }}>
        {/* rail */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              flexShrink: 0,
              background: done ? C.green : current ? (isPrompt ? C.amber : C.green) : "#fff",
              border: future ? `2px solid ${C.line}` : "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {done ? "✓" : s.n}
          </div>
          {s.n < lastStage && (
            <div style={{ width: 2, flex: 1, minHeight: 28, background: done ? C.green : C.line, marginTop: 2 }} />
          )}
        </div>
        {/* content */}
        <div style={{ paddingBottom: 22, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{s.title}</span>
          </div>
          {!future && (
            <>
              {badgeText && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isPrompt ? C.amber : C.greenDark,
                    background: isPrompt ? C.amberSoft : C.greenSoft,
                    border: `1px solid ${isPrompt ? C.amberLine : "transparent"}`,
                    padding: "2px 9px",
                    borderRadius: 99,
                  }}
                >
                  {badgeText}
                </div>
              )}
              {current && (() => {
                let bodyText = s.body;
                if (s.key === "done" && !paperCounty) {
                  bodyText =
                    refundPaid === true
                      ? "Congratulations, you're done! Your appeal is complete and the reduction is official. Since you already paid your tax bill, the county will refund the difference, usually within 6 to 8 weeks of the final decision. We'll keep watching your assessment, and when next year's cycle starts, we'll tell you whether it's worth appealing again."
                      : refundPaid === false
                      ? "Congratulations, you're done! Your corrected bill has posted at the lower value, which closes out this appeal completely. That's everything, the reduction is official and your bill now reflects it. Be sure to pay the corrected bill by the deadline to keep everything in good standing. We'll keep watching your assessment, and when next year's cycle starts, we'll tell you whether it's worth appealing again."
                      : "Congratulations, you're done! That closes out this appeal completely. We'll keep watching your assessment, and when next year's cycle starts, we'll tell you whether it's worth appealing again.";
                }
                // Render **bold** segments.
                const parts = (bodyText || "").split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: "8px 0 0" }}>
                    {parts.map((p, i) =>
                      p.startsWith("**") && p.endsWith("**") ? (
                        <strong key={i} style={{ color: C.ink }}>{p.slice(2, -2)}</strong>
                      ) : (
                        <span key={i}>{p}</span>
                      )
                    )}
                  </p>
                );
              })()}
              {current && s.key === "ratified" && (
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setRefundPaid(true); setStage((x) => x + 1); }}
                    style={{
                      flex: "1 1 160px",
                      background: C.green,
                      color: "#fff",
                      border: "none",
                      borderRadius: 9,
                      padding: "11px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    I already paid my tax bill
                  </button>
                  <button
                    onClick={() => { setRefundPaid(false); setStage(lastStage); }}
                    style={{
                      flex: "1 1 160px",
                      background: "#fff",
                      color: C.greenDark,
                      border: `1px solid ${C.green}`,
                      borderRadius: 9,
                      padding: "11px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    I haven't paid my tax bill yet
                  </button>
                </div>
              )}
              {current && s.selfReport && (
                <SelfReportInput
                  isRec={s.selfReport === "recommendation"}
                  onSubmit={(v) => {
                    if (s.selfReport === "final" && setProgress) {
                      setProgress((p) => ({ ...p, loggedValue: v }));
                    }
                    setStage((x) => x + 1);
                  }}
                />
              )}
              {current && s.refundSteps && (
                <>
                  <div style={{ margin: "12px 0 0" }}>
                    {s.refundSteps.map((rs, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: C.greenSoft,
                            color: C.greenDark,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            marginTop: 1,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 13, color: C.body, lineHeight: 1.55, flex: 1 }}>{rs}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setRefundPaid(true); setStage((x) => Math.min(lastStage, x + 1)); }}
                      style={{
                        flex: "1 1 160px",
                        background: C.green,
                        color: "#fff",
                        border: "none",
                        borderRadius: 9,
                        padding: "11px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Understood
                    </button>
                  </div>
                </>
              )}
              {meta && (
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: current ? 8 : 4 }}>{meta}</div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 24, color: C.ink, margin: "8px 0 4px" }}>Where your appeal stands</h2>
        <p style={{ color: C.body, fontSize: 14, lineHeight: 1.55, margin: "0 0 20px" }}>
          {paperCounty
            ? "Your county files on paper with no online record for us to read so we can't detect your result automatically. When your letter and corrected bill arrive, log them below and we'll track your appeal through to the finish."
            : "After the hearing there are a few stages before everything's final, and they can take weeks. We track them for you automatically and flag anything that needs your input."}
        </p>
        <PropertyBanner />

        <Card>
          {stages.map((s) => <Step key={s.key} s={s} />)}
        </Card>

        {/* demo stepper */}
        <div
          style={{
            marginTop: 18,
            border: `1px dashed ${C.line}`,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 600 }}>
            Demo control, step through the months after the hearing
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setStage((s) => Math.max(1, s - 1))}
              disabled={stage === 1}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.line}`,
                background: "#fff", color: stage === 1 ? C.muted : C.ink, fontSize: 13,
                cursor: stage === 1 ? "default" : "pointer", fontWeight: 600, opacity: stage === 1 ? 0.5 : 1,
              }}
            >
              ← Earlier
            </button>
            <span style={{ fontSize: 12.5, color: C.body, minWidth: 120, textAlign: "center" }}>
              Stage {stage} of {lastStage}
            </span>
            <button
              onClick={() => setStage((s) => Math.min(lastStage, s + 1))}
              disabled={stage === lastStage}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "none",
                background: stage === lastStage ? "#CBD3CE" : C.green, color: "#fff", fontSize: 13,
                cursor: stage === lastStage ? "default" : "pointer", fontWeight: 600,
              }}
            >
              Advance →
            </button>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
            <Toggle
              label="Paper-filing county (no online portal, self-report the result)"
              on={paperCounty}
              onClick={() => { setPaperCounty((v) => !v); setStage(1); setRefundPaid(null); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- demo control bar (clearly separated from the product) -----------------
function DemoBar({ edge, setEdge, progress, setProgress }) {
  return (
    <div
      style={{
        marginTop: 26,
        border: `1px dashed ${C.line}`,
        borderRadius: 12,
        padding: "12px 16px",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, fontWeight: 600 }}>
        Demo controls, edge cases
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Toggle
          label="No confirmed deadline (petition window not open yet)"
          on={edge.preTrim}
          onClick={() => setEdge({ ...edge, preTrim: !edge.preTrim })}
        />
        <Toggle
          label="Show appeal complete, value reduced (won)"
          on={progress.logged && progress.loggedOutcome === "reduced"}
          onClick={() =>
            setProgress({
              ...progress,
              logged: !(progress.logged && progress.loggedOutcome === "reduced"),
              closed: !(progress.logged && progress.loggedOutcome === "reduced"),
              loggedOutcome: !(progress.logged && progress.loggedOutcome === "reduced") ? "reduced" : null,
              loggedValue: !(progress.logged && progress.loggedOutcome === "reduced") ? PROPERTY.target : null,
            })
          }
        />
        <Toggle
          label="Show appeal complete, no change this year"
          on={progress.logged && progress.loggedOutcome === "nochange"}
          onClick={() =>
            setProgress({
              ...progress,
              logged: !(progress.logged && progress.loggedOutcome === "nochange"),
              closed: !(progress.logged && progress.loggedOutcome === "nochange"),
              loggedOutcome: !(progress.logged && progress.loggedOutcome === "nochange") ? "nochange" : null,
              loggedValue: null,
            })
          }
        />
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0,
        width: "100%",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 34,
          height: 20,
          borderRadius: 99,
          background: on ? C.green : "#D5DBD7",
          position: "relative",
          transition: "background .15s",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .15s",
          }}
        />
      </span>
      <span style={{ fontSize: 13, color: C.body, textAlign: "left", lineHeight: 1.4 }}>{label}</span>
    </button>
  );
}

// ===========================================================================
// SCREEN, Notification Center (in-product activity feed)
// ===========================================================================
function NotificationCenter({ go, back, prefs, readIds = [], markRead, markAllRead }) {
  // What "has happened" vs "upcoming" in the demo's present moment (Sep 10):
  // treat onboarding + early filing nudges as delivered, the rest as scheduled.
  const deliveredIds = ["welcome", "deadline_t7"];
  // Parse "Mon D" (e.g. "Sep 8") into a sortable timestamp so ordering is by
  // real date, not array position.
  const MON = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const ts = (when) => {
    const [m, d] = when.split(" ");
    return new Date(2026, MON[m] ?? 0, parseInt(d, 10) || 1).getTime();
  };
  const byDateDesc = (a, b) => ts(b.when) - ts(a.when);
  const allSorted = [...NOTIFICATIONS].sort(byDateDesc);
  const delivered = NOTIFICATIONS.filter((n) => deliveredIds.includes(n.id)).sort(byDateDesc);
  const anyUnread = delivered.some((n) => !readIds.includes(n.id));

  const Row = ({ n, isUpcoming }) => {
    const unread = !isUpcoming && !readIds.includes(n.id);
    return (
      <div
        onClick={() => {
          if (!isUpcoming && markRead) markRead(n.id);
          go("emailPreview", { focusId: n.id, from: "notifications" });
        }}
        style={{
          display: "flex",
          gap: 12,
          padding: "13px 14px",
          borderRadius: 12,
          border: `1px solid ${n.urgent ? C.amberLine : C.line}`,
          background: n.urgent ? C.amberSoft : unread ? C.greenSofter : "#fff",
          marginBottom: 10,
          cursor: "pointer",
          opacity: isUpcoming ? 0.85 : 1,
        }}
      >
        <div style={{ position: "relative", fontSize: 18, lineHeight: 1.3 }}>
          {channelIcon(n.channel)}
          {unread && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.green,
                border: "1.5px solid #fff",
              }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: unread ? 800 : 700, color: C.ink }}>{n.title}</span>
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{n.when}</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.body, marginTop: 3, lineHeight: 1.5 }}>
            {n.preview}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.greenDark, background: C.greenSoft, padding: "2px 7px", borderRadius: 99 }}>
              {phaseLabel[n.phase]}
            </span>
            {n.urgent && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.amber, background: "#fff", border: `1px solid ${C.amberLine}`, padding: "2px 7px", borderRadius: 99 }}>
                Action needed
              </span>
            )}
            {isUpcoming && (
              <span style={{ fontSize: 10.5, color: C.muted }}>Scheduled · {n.trigger}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onProfile={() => go("account")} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <div style={{ marginBottom: 4 }}>
          <BackLink back={back} />
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "8px 0 4px" }}>Your updates</h2>
        <p style={{ color: C.body, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
          Everything we've sent and will send about your appeal. Because the process runs
          for months, we reach you by{" "}
          <strong>email</strong>{" "}
          so you never miss a deadline. Tap any update to preview it.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>
            All updates
          </div>
          {anyUnread && markAllRead && (
            <button
              onClick={markAllRead}
              style={{ background: "none", border: "none", color: C.greenDark, fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0 }}
            >
              Mark all as read
            </button>
          )}
        </div>
        {allSorted.map((n) => (
          <Row key={n.id} n={n} isUpcoming={!deliveredIds.includes(n.id)} />
        ))}

        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginTop: 16 }}>
          These are scheduled automatically based on your real deadlines. Dates shift if your
          hearing date changes, we recalculate and re-time every reminder.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN, Notification Preferences
// ===========================================================================
function NotificationPrefs({ go, back, prefs, setPrefs }) {
  const Toggle2 = ({ on, onClick, locked }) => (
    <button
      onClick={locked ? undefined : onClick}
      style={{
        width: 44,
        height: 26,
        borderRadius: 99,
        border: "none",
        background: on ? C.green : "#CBD3CE",
        position: "relative",
        cursor: locked ? "not-allowed" : "pointer",
        flexShrink: 0,
        transition: "background .2s",
        opacity: locked ? 0.55 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );

  const Pref = ({ label, desc, on, onClick, last, locked, lockNote }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 0",
        borderBottom: last ? "none" : `1px solid ${C.line}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{label}</span>
          {locked && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: "#EEF1EF", padding: "2px 7px", borderRadius: 99 }}>
              Always on
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle2 on={on} onClick={onClick} locked={locked} />
    </div>
  );

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onProfile={() => go("account")} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 24, color: C.ink, margin: "8px 0 4px" }}>Notification settings</h2>
        <p style={{ color: C.body, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
          Choose how we reach you. We'll always send the few critical, deadline-driven alerts
          so your appeal can't fail on a technicality, you can turn off everything else.
        </p>

        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
            Channels
          </div>
          <Pref
            label="Email"
            desc="The full message, with links to the exact step you need and any documents to send. This is how the product reaches you throughout your appeal."
            on={prefs.email}
            onClick={() => setPrefs({ ...prefs, email: !prefs.email })}
          />
          <Pref
            label="Text message (SMS)"
            desc="A short text for the time-sensitive moments, like a deadline coming up or your hearing being scheduled. A quick nudge that points you back to the full email."
            on={prefs.sms}
            onClick={() => setPrefs({ ...prefs, sms: !prefs.sms })}
            last
          />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
            What you'll get
          </div>
          <Pref
            label="Deadline reminders"
            desc="Before each filing, evidence, and hearing deadline. These stay on because a missed deadline can permanently end your appeal."
            on={true}
            locked
            onClick={() => {}}
          />
          <Pref
            label="Status updates"
            desc="When your hearing is scheduled, your result is in, and your refund is due."
            on={prefs.status}
            onClick={() => setPrefs({ ...prefs, status: !prefs.status })}
            last
          />
        </Card>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN, Email / SMS preview (renders a notification as a real message)
// ===========================================================================
function EmailPreview({ go, back, nav, markRead }) {
  const focusId = nav?.focusId || "deadline_t2";
  const n = NOTIFICATIONS.find((x) => x.id === focusId) || NOTIFICATIONS[0];

  // Opening a message marks it read (clears the bell badge for delivered items).
  useEffect(() => {
    if (markRead && focusId) markRead(focusId);
  }, [focusId]);

  // The product reaches homeowners by email, so previews are email-only.
  const bodyParas = (n.emailBody || n.preview).split("\n\n");

  return (
    <div style={{ background: C.page, minHeight: 560, position: "relative" }}>
      <TopBar onHome={() => go("welcome")} onProfile={() => go("account")} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(18px, 5vw, 26px) clamp(14px, 4vw, 22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 22, color: C.ink, margin: "8px 0 2px" }}>Message preview</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 16px" }}>
          {phaseLabel[n.phase]} · sent {n.when} · email{n.sms ? " and text" : ""}
        </p>

        <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
            {/* email header */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.line}`, background: C.greenSofter }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Logo />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>
                Property Tax Appeal &lt;hello@taxappeal.app&gt; → jane@email.com
              </div>
            </div>
            {/* email body */}
            <div style={{ padding: "18px 18px 20px" }}>
              <p style={{ fontSize: 14, color: C.body, lineHeight: 1.65, margin: "0 0 12px" }}>Hi Jane,</p>
              {bodyParas.map((para, i) => (
                <p key={i} style={{ fontSize: 14, color: C.body, lineHeight: 1.65, margin: "0 0 12px" }}>{para}</p>
              ))}
              {n.cta && (
                <div style={{ margin: "18px 0 8px" }}>
                  <span style={{ display: "inline-block", background: C.green, color: "#fff", fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 10 }}>
                    {n.cta} →
                  </span>
                </div>
              )}
            </div>
          </div>

          {n.sms && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Text message version
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <div style={{ fontSize: 11.5, color: C.muted, marginLeft: 4 }}>Property Tax Appeal</div>
                <div style={{ maxWidth: "85%", background: C.greenSoft, color: C.ink, borderRadius: "16px 16px 16px 4px", padding: "11px 14px", fontSize: 14, lineHeight: 1.5 }}>
                  {n.sms}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}


// ===========================================================================
// Root, screen router + progress state
// ===========================================================================
// ===========================================================================
// SCREEN, Document center, one place to view/download every document
// ===========================================================================
function DocumentCenter({ go, back, progress, unread }) {
  const [open2026, setOpen2026] = useState(true);
  const [open2025, setOpen2025] = useState(false);
  const [petitionUploaded, setPetitionUploaded] = useState(false);
  const petitionFileRef = useRef(null);
  const onPetitionFile = (e) => {
    if (e.target.files && e.target.files.length > 0) setPetitionUploaded(true);
  };
  const docs = [
    {
      title: "Evidence package",
      desc: "Comparable sales, valuation summary and cover sheet (PDF)",
      meta: "Ready",
      ready: true,
      action: () => downloadEvidencePackage(),
      actionLabel: "Download",
    },
    {
      title: "Hearing-day packet",
      desc: "Your 30-second script, do/don't list and what to expect (PDF)",
      meta: progress.prepared ? "Ready" : "Available after you prepare for your hearing",
      ready: true,
      action: () => downloadHearingPacket(),
      actionLabel: "Download",
    },
    {
      title: "Filed petition (DR-486)",
      desc: petitionUploaded
        ? "Your uploaded copy is saved with your appeal"
        : "Your filing confirmation from the county",
      meta: !progress.filed
        ? "Available once you file your petition"
        : petitionUploaded
        ? "Uploaded, saved to your appeal"
        : "Filed. If we couldn't retrieve it automatically, upload your copy so it's saved here",
      ready: progress.filed,
      action: null,
      actionLabel: null,
      uploadAction: progress.filed && !petitionUploaded ? () => petitionFileRef.current && petitionFileRef.current.click() : null,
      uploadLabel: "Upload",
    },
  ];

  return (
    <div>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(18px,5vw,26px)" }}>
        <div style={{ marginBottom: 14 }}>
          <BackLink back={back} />
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "0 0 6px" }}>Your documents</h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
          Everything for your appeal in one place, grouped by tax year.
        </p>

        <YearGroup year="2026" open={open2026} onToggle={() => setOpen2026((v) => !v)}>
          {docs.map((d, i) => <DocCard key={i} d={d} />)}
        </YearGroup>
        <input ref={petitionFileRef} type="file" accept="application/pdf,image/*" onChange={onPetitionFile} style={{ display: "none" }} />

        <YearGroup year="2025" open={open2025} onToggle={() => setOpen2025((v) => !v)}>
          {DOCS_2025.map((d, i) => <DocCard key={i} d={d} />)}
        </YearGroup>
      </div>
    </div>
  );
}

// Collapsible year section for the document center (mirrors the account screen).
function YearGroup({ year, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "6px 0 10px", cursor: "pointer", fontFamily: "inherit" }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{year} tax year</span>
        <span style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: C.greenSofter, color: C.greenDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}

function DocCard({ d }) {
  return (
    <Card style={{ marginBottom: 12, padding: 16, opacity: d.ready ? 1 : 0.65 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 17 }}>📄</span>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{d.title}</span>
          </div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{d.desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignItems: "stretch" }}>
          {d.action && d.ready && (
            <button
              onClick={d.action}
              style={{ background: C.greenSoft, color: C.greenDark, border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {d.actionLabel}
            </button>
          )}
          {d.uploadAction && d.ready && (
            <button
              onClick={d.uploadAction}
              style={{ background: "#fff", color: C.greenDark, border: `1px solid ${C.green}`, borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {d.uploadLabel || "Upload"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Last year's archived documents (matches the completed 2025 appeal on the account screen).
const DOCS_2025 = [
  {
    title: "Evidence package (2025)",
    desc: "The comps and valuation summary from last year's appeal (PDF)",
    meta: "Archived",
    ready: true,
    action: () => downloadEvidencePackage(),
    actionLabel: "Download",
  },
  {
    title: "VAB decision letter (2025)",
    desc: "Final decision: assessed value reduced from $518,000 to $479,000",
    meta: "Appeal complete, you saved ~$780",
    ready: true,
    action: null,
    actionLabel: null,
  },
];

// ===========================================================================
// SCREEN, Account, plan status and profile (makes the subscription tangible)
// ===========================================================================
function AccountScreen({ go, back, nav, progress, unread }) {
  const justAdded = nav?.added;
  const [open2025, setOpen2025] = useState(false);
  const [open2026, setOpen2026] = useState(true);

  const Row = ({ label, value, sub }) => (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, color: C.ink, fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  // A single property row inside a year group.
  const PropertyCard = ({ address, city, status, statusTone, onClick, stats }) => (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 10,
        cursor: onClick ? "pointer" : "default", background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{address}</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 1 }}>{city}</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: statusTone.bg, color: statusTone.fg }}>{status}</span>
      </div>
      {stats && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.fg || C.ink }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      {onClick && (
        <div style={{ fontSize: 12.5, color: C.greenDark, fontWeight: 600, marginTop: 10 }}>Open this appeal →</div>
      )}
    </div>
  );

  const YearHeader = ({ year, open, onToggle }) => (
    <button
      onClick={onToggle}
      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "6px 0 10px", cursor: "pointer", fontFamily: "inherit" }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{year} tax year</span>
      <span style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: C.greenSofter, color: C.greenDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{open ? "−" : "+"}</span>
    </button>
  );

  // Next action for the continue-appeal card, mirrors the Action Center's spine.
  const nextStep = !progress.filed
    ? { label: "File your petition", sub: "Your next step" }
    : !progress.evidence
    ? { label: "Submit your evidence", sub: "Your next step" }
    : !progress.prepared
    ? { label: "Prepare for your hearing", sub: "Your next step" }
    : !progress.closed
    ? { label: "Track your status", sub: "Your next step" }
    : null;

  return (
    <div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(18px,5vw,26px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenSoft, color: C.greenDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            JH
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>{PROPERTY.owner}</div>
            <div style={{ fontSize: 13.5, color: C.muted }}>jane@email.com</div>
          </div>
        </div>

        {/* Your 2026 Appeals, one row per property so they stack as more are added */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
          Your 2026 appeals
        </div>
        <Card style={{ marginBottom: justAdded ? 12 : 16, padding: 0, overflow: "hidden", border: `1px solid ${C.green}` }}>
          <button
            onClick={() => go("action")}
            style={{ width: "100%", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{PROPERTY.address}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{PROPERTY.cityLine}</div>
              {nextStep && (
                <div style={{ fontSize: 12.5, color: C.greenDark, fontWeight: 600, marginTop: 6 }}>
                  Next: {nextStep.label}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: progress.closed ? C.greenDark : C.amber, background: progress.closed ? C.greenSoft : C.amberSoft, border: `1px solid ${progress.closed ? "transparent" : C.amberLine}`, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {progress.closed ? "Appeal complete" : "In progress"}
              </span>
              <span style={{ color: C.greenDark, fontSize: 18 }}>›</span>
            </div>
          </button>
        </Card>
        {justAdded && (
          <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden", border: `1px solid ${C.amberLine}` }}>
            <button
              onClick={() => go("confirmed", { rebuilding: true })}
              style={{ width: "100%", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{nav?.addedAddr || "8420 SW 142nd Ave"}</div>
                <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{nav?.addedCity || "Miami, FL 33183"}</div>
                <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 600, marginTop: 6 }}>Next: we’re building your evidence package</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: C.amberSoft, border: `1px solid ${C.amberLine}`, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                  Building package
                </span>
                <span style={{ color: C.amber, fontSize: 18 }}>›</span>
              </div>
            </button>
          </Card>
        )}
        <button
          onClick={() => go("addProperty", { mode: "add" })}
          style={{
            width: "100%", border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: 14,
            background: C.greenSofter, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: C.greenDark, fontSize: 14, fontWeight: 700, marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span> Add a new property
        </button>
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
          Adding an additional Miami-Dade property is a $49 charge. More counties coming soon.
        </div>

        {/* Plan card, makes the subscription model visible */}
        <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.greenDark, color: "#fff", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12.5, opacity: 0.85 }}>Your plan</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>DIY Appeal</div>
              </div>
              <span style={{ background: "rgba(255,255,255,.22)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>Active</span>
            </div>
          </div>
          <div style={{ padding: "6px 18px 14px" }}>
            <Row label="Billing" value={justAdded ? "$79 / year + $49 add-on" : "$79 / year"} sub={justAdded ? "Renews at $128/year in Sep 2027 (add-on included)" : "Renews Sep 2027"} />
            <Row label="What's included" value={justAdded ? "DIY filing and evidence package for 2 properties, guided steps" : "DIY filing, evidence package, guided steps"} sub="AI assistant and email support within one business day" />
            <div style={{ paddingTop: 14 }}>
              <div style={{ fontSize: 12.5, color: C.body, lineHeight: 1.55, marginBottom: 12 }}>
                Want us to handle everything next year, including the filing and hearing? You can upgrade to full-service any time.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn small onClick={() => go("upgrade")}>Upgrade to full-service</Btn>
                <Btn small variant="ghost" onClick={() => go("manageSub")}>Manage subscription</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Past appeals archive */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Past appeals</div>
          <YearHeader year="2025" open={open2025} onToggle={() => setOpen2025((v) => !v)} />
          {open2025 && (
            <PropertyCard
              address={PROPERTY.address}
              city={PROPERTY.cityLine}
              status="Appeal complete"
              statusTone={{ bg: C.greenSoft, fg: C.greenDark }}
              stats={[
                { label: "Original", value: "$518,000" },
                { label: "New value", value: "$479,000", fg: C.greenDark },
                { label: "You saved", value: "~$780", fg: C.greenDark },
              ]}
            />
          )}
        </Card>

        <Card>
          <button onClick={() => go("prefs")} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 0", fontSize: 14.5, color: C.ink, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Notification settings →
          </button>
        </Card>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN, Upgrade to full-service (fake checkout)
// ===========================================================================
function UpgradeScreen({ go, back }) {
  const [paying, setPaying] = useState(false);
  const [useOnFile, setUseOnFile] = useState(true);
  const FULL_SERVICE = 149;
  const PROMO = 99;
  const pay = () => {
    setPaying(true);
    setTimeout(() => go("account"), 1000);
  };
  const includes = [
    "We file your property tax appeal for you",
    "We build and submit your evidence to both places",
    "A licensed pro represents you at the hearing",
    "We track your result and guide you through any refund",
  ];
  return (
    <div style={{ background: C.page, minHeight: 560 }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(18px,5vw,26px) clamp(14px,4vw,22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 24, color: C.ink, margin: "6px 0 6px" }}>Upgrade to full-service</h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 12px" }}>
          Prefer to hand the whole thing off? With full-service, we handle the filing,
          the evidence, and the hearing for you, start to finish.
        </p>
        <div style={{ fontSize: 12.5, color: C.muted, background: C.greenSofter, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 20, lineHeight: 1.5 }}>
          Since your 2026 appeal is already complete, this upgrade sets you up for your 2027 appeal. If
          you haven't filed your 2026 petition yet and want us to take it over before the filing
          deadline, email us at <strong>help@taxappeal.app</strong> and we'll get you set up for this year.
        </div>

        <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.greenDark, color: "#fff", padding: "16px 18px" }}>
            <div style={{ fontSize: 12.5, opacity: 0.85 }}>Full-service, per property / year</div>
            <div style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7, textDecoration: "line-through" }}>{money(FULL_SERVICE)}</span>
              {money(PROMO)}
            </div>
          </div>
          <div style={{ padding: "14px 18px" }}>
            {includes.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 9 }}>
                <span style={{ color: C.green, fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{it}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13.5, color: C.body }}>Full-service (2027 tax year)</span>
            <span style={{ fontSize: 13.5, color: C.muted, textDecoration: "line-through" }}>{money(FULL_SERVICE)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.greenDark, fontWeight: 600, marginBottom: 12 }}>
            <span>Limited-time promo</span>
            <span>-{money(FULL_SERVICE - PROMO)}</span>
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Due today</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.greenDark }}>{money(PROMO)}</span>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 10 }}>Payment method</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" checked={useOnFile} onChange={() => setUseOnFile(true)} />
            <span style={{ fontSize: 14.5, color: C.ink, fontWeight: 600 }}>Visa ···· 4242</span>
            <span style={{ fontSize: 12, color: C.muted }}>on file</span>
          </label>
          {!useOnFile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <input placeholder="Card number" style={payInput} />
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="MM / YY" style={{ ...payInput, flex: 1 }} />
                <input placeholder="CVC" style={{ ...payInput, flex: 1 }} />
              </div>
            </div>
          )}
          <button onClick={() => setUseOnFile((v) => !v)} style={{ background: "none", border: "none", color: C.greenDark, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "10px 0 0" }}>
            {useOnFile ? "Use a different card" : "Use card on file"}
          </button>
        </Card>

        <Btn full onClick={() => {}} disabled>
          {`Pay ${money(PROMO)} and upgrade`}
        </Btn>
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          This is a demo checkout. No real card is charged.
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN, Manage subscription
// ===========================================================================
function ManageSubscription({ go, back }) {
  return (
    <div style={{ background: C.page, minHeight: 560 }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(18px,5vw,26px) clamp(14px,4vw,22px)" }}>
        <BackLink back={back} />
        <h2 style={{ fontSize: 24, color: C.ink, margin: "6px 0 16px" }}>Manage subscription</h2>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 12 }}>Current plan</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>DIY Appeal</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, background: C.greenSoft, padding: "3px 10px", borderRadius: 999 }}>Active</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>$79 / year · renews Sep 2027</div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 12 }}>What renews next year</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
            <div>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>11455 SW 117th Ct</div>
              <div style={{ fontSize: 12, color: C.muted }}>DIY Appeal, annual</div>
            </div>
            <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>$79</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
            Additional properties in the same county are a one-time $49 add-on the year you add them. Once added, they roll into this annual subscription so you don’t have to set them up again each year.
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <button onClick={() => go("upgrade")} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 0", fontSize: 14.5, color: C.ink, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.line}`, fontFamily: "inherit" }}>
            Upgrade to full-service →
          </button>
          <button onClick={() => {}} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 0", fontSize: 14.5, color: C.ink, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.line}`, fontFamily: "inherit" }}>
            Update payment method →
          </button>
          <button onClick={() => {}} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 0", fontSize: 14.5, color: C.muted, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel auto-renew
          </button>
        </Card>

        <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
          Canceling auto-renew keeps your current appeal active through this tax year.
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
// SCREEN, Help / FAQ. Reached from the "Help" nav item. The guided flow assumes
// the happy path; this page is where users land when something goes wrong or
// they hit an edge case (rejected filing, lost credentials, reschedule, escrow,
// settlement offer, losing at the VAB).
// ===========================================================================
function HelpFAQ({ go, back, unread }) {
  const [open, setOpen] = useState(null);
  const toggle = (i) => setOpen((v) => (v === i ? null : i));

  // Green-number step list, matching the file-petition and evidence step format
  // (no trailing period on the number).
  const FaqSteps = ({ items }) => (
    <div style={{ margin: "0 0 8px" }}>
      {items.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <span style={{ color: C.green, fontWeight: 700, fontSize: 13, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
          <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{t}</span>
        </div>
      ))}
    </div>
  );

  // detailed = fail-path items that need real steps; concise = quick answers.
  const faqs = [
    {
      q: "My petition was rejected or I think I filed it wrong",
      detailed: true,
      a: (
        <>
          <p style={{ margin: "0 0 8px" }}>
            A petition can bounce for a few reasons, most often an unpaid $15 fee (a petition isn't
            considered filed until the fee is paid), a wrong or mistyped folio, or a missing signature.
            Here's how to sort it out:
          </p>
          <FaqSteps items={[
            "Check your email and your AXIA confirmation for the exact reason given.",
            "If the fee didn't go through, log back into the VAB portal and pay it. The filing isn't complete until it's paid.",
            "If a detail is wrong (folio, owner name, address), you can usually correct it in the portal before your hearing, or call the VAB clerk to fix it.",
            "If you're inside the filing window, the cleanest fix is often to re-file a clean petition. If the deadline has passed, call the clerk right away to ask about a good-cause late filing.",
          ]} />
          <p style={{ margin: 0 }}>
            Miami-Dade VAB clerk: <strong>(305) 375-5641</strong>. If you email us at help@taxappeal.app with what the
            rejection said, we'll walk you through the specific fix.
          </p>
        </>
      ),
    },
    {
      q: "The county offered to lower my value, or I reached an agreement with the Property Appraiser",
      detailed: true,
      a: (
        <>
          <p style={{ margin: "0 0 8px" }}>
            Good news, that's often the fastest way to win. If the Property Appraiser agrees to reduce
            your assessed value, you don't need to go through the hearing. You can accept it and
            withdraw your petition.
          </p>
          <FaqSteps items={[
            "Get the agreed value in writing (email is fine) from the Property Appraiser's office.",
            "Withdraw your petition through the VAB clerk so your hearing is cancelled and the agreed value stands.",
            "Watch for your corrected tax bill (or a refund, if you already paid) reflecting the lower value.",
          ]} />
          <p style={{ margin: 0 }}>
            One caution: only withdraw once the reduction is confirmed in writing. If you're unsure
            whether the offer matches what your evidence supports, reach out to us at help@taxappeal.app before you accept.
          </p>
        </>
      ),
    },
    {
      q: "I lost my Transaction Number or Password",
      detailed: true,
      a: (
        <>
          <p style={{ margin: "0 0 8px" }}>
            Your Transaction Number and Password come from your filing receipt and are what you use to
            log into AXIA to upload evidence and check status. If you've lost them, you don't have to
            re-file:
          </p>
          <FaqSteps items={[
            "Check the confirmation email from your filing, they're printed at the bottom of the AXIA receipt.",
            "If you can't find it, contact the Miami-Dade VAB clerk and ask them to reprint or resend your receipt. They can look it up by your folio or petition details.",
            <>VAB clerk: <strong>(305) 375-5641</strong>. Have your folio ({PROPERTY.folio}) ready.</>,
          ]} />
          <p style={{ margin: 0 }}>
            Once you have them again, head back to your evidence step and pick up where you left off.
          </p>
        </>
      ),
    },
    {
      q: "I can't make my hearing date, can I reschedule?",
      detailed: true,
      a: (
        <>
          <p style={{ margin: "0 0 8px" }}>
            Yes, Florida law lets you reschedule your hearing <strong>once</strong> for good cause. "Good cause" means something outside your control that prevents you
            from being properly represented, for example a death in the immediate family or an
            emergency medical problem.
          </p>
          <FaqSteps items={[
            "Submit a written request to the VAB clerk before your hearing, or as soon as you're able.",
            "Include a short explanation and any supporting documentation for your circumstances.",
            "The clerk will send a new hearing notice if it's granted.",
          ]} />
          <p style={{ margin: 0 }}>
            It's a single reschedule, so use it when you truly need it. VAB clerk: <strong>(305) 375-5641</strong>.
          </p>
        </>
      ),
    },
    {
      q: "My mortgage company pays my taxes through escrow. What do I do about the tax bill?",
      detailed: true,
      a: (
        <>
          <p style={{ margin: "0 0 8px" }}>
            This is very common. If you have a mortgage, your lender usually collects property taxes as
            part of your monthly payment and pays the county from an escrow account, so you may never see
            a separate bill. A couple of things to know:
          </p>
          <FaqSteps items={[
            "You still need the tax paid on time to keep your appeal alive, but your lender typically handles that automatically from escrow. It's worth confirming with your servicer that it's scheduled.",
            "If you win, the refund goes to whoever paid the bill, usually your lender. Contact your mortgage servicer so they credit it back to your escrow account.",
            "When your assessment drops, your escrow payment should adjust at the next annual escrow analysis, lowering your monthly payment.",
          ]} />
          <p style={{ margin: 0 }}>A quick call to your servicer is the best way to confirm how they're handling it.</p>
        </>
      ),
    },
    {
      q: "How long does the whole process take?",
      a: "From filing to a final result usually runs several months. You file in September, the county schedules your hearing anytime from October through the spring, the magistrate mails a recommendation about 20 days after the hearing, and the Board ratifies it at a public meeting a few weeks later. We track every stage and email you when something needs your attention.",
    },
    {
      q: "Do I need a lawyer for the VAB hearing?",
      a: "No. VAB hearings are designed for homeowners to represent themselves. They're informal, usually about 15 minutes, and we give you a script and a one-page packet so you know exactly what to say.",
    },
    {
      q: "Will filing an appeal make my taxes go up?",
      a: "No. The VAB can't raise a homestead property's value as a result of your petition. The worst realistic outcome is that your assessment stays the same.",
    },
    {
      q: "Can I add another property to my account?",
      a: "Yes. From your Home screen, tap \u201cAdd a new property.\u201d Another Miami-Dade property is a $49 charge for that year, and it rolls into your annual subscription after that. More counties are coming soon.",
    },
  ];

  return (
    <div style={{ background: C.page, minHeight: 560 }}>
      <TopBar onHome={() => go("welcome")} onBell={() => go("notifications")} onProfile={() => go("account")} unread={unread} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(18px,5vw,26px)" }}>
        <div style={{ marginBottom: 14 }}>
          <BackLink back={back} />
        </div>
        <h2 style={{ fontSize: 24, color: C.ink, margin: "0 0 6px" }}>Help &amp; FAQ</h2>
        <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
          Answers to common questions, and what to do if something doesn't go to plan. Still stuck?
          Our assistant knows your case and can walk you through it.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Card key={i} style={{ padding: 0, overflow: "hidden", borderColor: isOpen ? C.green : C.line }}>
                <button
                  onClick={() => toggle(i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "none", border: "none", padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{f.q}</span>
                  <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, border: `1px solid ${C.line}`, background: C.greenSofter, color: C.greenDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{isOpen ? "\u2212" : "+"}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", fontSize: 13.5, color: C.body, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                    {f.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div style={{ marginTop: 20, background: C.greenSofter, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", fontSize: 13, color: C.body, lineHeight: 1.6 }}>
          Can't find what you need? Open the assistant (the chat button) for case-specific help, or reach
          a human and we'll reply within one business day.
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
function AppNav({ current, go, unread, collapsed, setCollapsed, onHelp }) {
  const items = [
    { key: "account", label: "Home", icon: "home" },
    { key: "documents", label: "Documents", icon: "docs" },
    { key: "notifications", label: "Notifications", icon: "bell", badge: unread },
    { key: "faq", label: "Help", icon: "help" },
  ];
  // Which nav item is "active" for a given screen (sub-screens map to their home).
  const activeFor = (screen) => {
    if (["account"].includes(screen)) return "account";
    if (["documents"].includes(screen)) return "documents";
    if (["notifications", "emailPreview", "prefs"].includes(screen)) return "notifications";
    if (["faq"].includes(screen)) return "faq";
    if (["action", "file", "evidence", "hearing", "status", "confirmed", "addProperty"].includes(screen)) return "appeal";
    return "";
  };
  const active = activeFor(current);

  const Icon = ({ name, size = 20 }) => {
    const s = { width: size, height: size, display: "block" };
    const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
    if (name === "home") return (<svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M3 11l9-8 9 8" /><path {...stroke} d="M5 10v10h14V10" /></svg>);
    if (name === "docs") return (<svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M6 2h9l5 5v15H6z" /><path {...stroke} d="M14 2v6h6" /></svg>);
    if (name === "bell") return (<svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path {...stroke} d="M13.7 21a2 2 0 01-3.4 0" /></svg>);
    if (name === "chat") return (<svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M21 11.5a8.4 8.4 0 01-9 8 9 9 0 01-4-1L3 20l1.5-4a8.4 8.4 0 01-1-4 8.5 8.5 0 019-8 8.4 8.4 0 018.5 7.5z" /></svg>);
    if (name === "help") return (<svg viewBox="0 0 24 24" style={s}><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5" /><path {...stroke} d="M12 17h.01" /></svg>);
    if (name === "appeal") return (<svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M9 11l3 3L22 4" /><path {...stroke} d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>);
    return null;
  };

  const go2 = (key) => {
    go(key);
  };

  return (
    <>
      {/* DESKTOP RAIL */}
      <div
        className="app-rail"
        style={{
          width: collapsed ? 62 : 208,
          flexShrink: 0,
          background: "#fff",
          borderRight: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          padding: "16px 10px",
          transition: "width .18s ease",
          alignSelf: "stretch",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 16, paddingLeft: collapsed ? 0 : 6 }}>
          {!collapsed && <Logo />}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <button
          onClick={() => go("account")}
          title="Account"
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: collapsed ? "8px 0" : "8px 10px", justifyContent: collapsed ? "center" : "flex-start", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 12, borderBottom: `1px solid ${C.line}`, paddingBottom: 14 }}
        >
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.greenSoft, color: C.greenDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>JH</span>
          {!collapsed && <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>Jane Homeowner</span>}
        </button>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((it) => {
            const on = active === it.key;
            return (
              <button
                key={it.key}
                onClick={() => go2(it.key)}
                title={it.label}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: collapsed ? "11px 0" : "11px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: on ? C.greenSoft : "transparent",
                  color: on ? C.greenDark : C.body,
                  fontWeight: on ? 700 : 500, fontSize: 14.5, fontFamily: "inherit",
                  position: "relative",
                }}
              >
                <span style={{ position: "relative", display: "flex" }}>
                  <Icon name={it.icon} />
                  {it.badge > 0 && (
                    <span style={{ position: "absolute", top: -5, right: -6, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: C.red, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.badge}</span>
                  )}
                </span>
                {!collapsed && <span>{it.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MOBILE BOTTOM TABS */}
      <nav
        className="app-tabs"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 55,
          background: "#fff", borderTop: `1px solid ${C.line}`,
          display: "none",
          justifyContent: "space-around", alignItems: "center",
          padding: "6px 4px 8px", boxShadow: "0 -4px 16px rgba(20,40,30,.06)",
        }}
      >
        {items.map((it) => {
          const on = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => go2(it.key)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: on ? C.greenDark : C.muted, fontFamily: "inherit", padding: "4px 0" }}
            >
              <span style={{ position: "relative", display: "flex" }}>
                <Icon name={it.icon} size={22} />
                {it.badge > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -7, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: C.red, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.badge}</span>
                )}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{it.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);

  const [progress, setProgress] = useState({
    filed: false,
    evidence: false,
    prepared: false,
    logged: false,
    closed: false,
    loggedValue: null,
    loggedOutcome: null,
  });
  const [edge, setEdge] = useState({ partialPay: false, missedAxia: false, dueSoonPA: false, preTrim: false, hearingSet: false });
  const [prefs, setPrefs] = useState({ email: true, sms: true, status: true, tips: true });
  const [nav, setNav] = useState({});
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [helpSignal, setHelpSignal] = useState(0);
  // Which "delivered" messages have been read. Starts empty, so the two already-
  // sent messages show as unread on the bell until the user opens or clears them.
  const deliveredIds = ["welcome", "deadline_t7"];
  const [readIds, setReadIds] = useState(deliveredIds);
  const markRead = (id) =>
    setReadIds((r) => (r.includes(id) ? r : [...r, id]));
  const markAllRead = () => setReadIds(deliveredIds);
  const unreadCount = deliveredIds.filter((id) => !readIds.includes(id)).length;

  const go = (s, navParam) => {
    setHistory((h) => [...h, screen]);
    if (navParam) setNav(navParam);
    setScreen(s);
    if (typeof window !== "undefined") window.scrollTo?.(0, 0);
  };

  const back = () => {
    setHistory((h) => {
      if (h.length === 0) { setScreen("action"); return h; }
      const prev = h[h.length - 1];
      setScreen(prev);
      if (typeof window !== "undefined") window.scrollTo?.(0, 0);
      return h.slice(0, -1);
    });
  };

  const screens = {
    welcome: <Welcome go={go} />,
    addProperty: <ConfirmProperty go={go} nav={nav} unread={unreadCount} />,
    payAddProperty: <AddPropertyPayment go={go} back={back} nav={nav} />,
    confirmed: <Confirmed go={go} nav={nav} edge={edge} setEdge={setEdge} unread={unreadCount} />,
    action: <ActionCenter go={go} progress={progress} setProgress={setProgress} edge={edge} setEdge={setEdge} unread={unreadCount} />,
    file: <FilePetition go={go} back={back} progress={progress} setProgress={setProgress} unread={unreadCount} />,
    evidence: <SubmitEvidence go={go} back={back} progress={progress} setProgress={setProgress} edge={edge} setEdge={setEdge} unread={unreadCount} />,
    hearing: <PrepareHearing go={go} back={back} progress={progress} setProgress={setProgress} edge={edge} unread={unreadCount} />,
    notifications: <NotificationCenter go={go} back={back} prefs={prefs} readIds={readIds} markRead={markRead} markAllRead={markAllRead} />,
    prefs: <NotificationPrefs go={go} back={back} prefs={prefs} setPrefs={setPrefs} />,
    emailPreview: <EmailPreview go={go} back={back} nav={nav} markRead={markRead} />,
    status: <StatusTracker go={go} back={back} progress={progress} setProgress={setProgress} unread={unreadCount} />,
    documents: <DocumentCenter go={go} back={back} progress={progress} unread={unreadCount} />,
    account: <AccountScreen go={go} back={back} nav={nav} progress={progress} unread={unreadCount} />,
    upgrade: <UpgradeScreen go={go} back={back} />,
    manageSub: <ManageSubscription go={go} back={back} />,
    faq: <HelpFAQ go={go} back={back} unread={unreadCount} />,
  };

  // The nav appears once onboarding is done. The welcome, confirm-property, and
  // "here's what we're appealing" screens are a one-time first-run sequence, not
  // destinations, so the nav would let someone skip the reveal by jumping Home.
  const onboardingScreens = ["welcome", "addProperty", "confirmed", "payAddProperty"];
  const showNav = !onboardingScreens.includes(screen);
  return (
    <div
      className="app-shell-pad"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "#DDE4E0",
        minHeight: "100vh",
        padding: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <style>{`
        .pulse { animation: p 1.1s ease-in-out infinite; }
        @keyframes p { 0%,100%{opacity:.5} 50%{opacity:1} }
        * { box-sizing: border-box; }
        .app-topbar { display: none; }
        .app-topbar-standalone { display: flex; }
        @media (max-width: 480px) {
          .app-shell-pad { padding: 0 !important; }
          .topbar-name { display: none !important; }
          .topbar-logo { margin-left: 0 !important; }
          .app-topbar { margin-bottom: 14px; display: flex !important; }
          .topbar-actions { display: none !important; }
          .app-rail { display: none !important; }
          .app-tabs { display: flex !important; }
          .app-content-pad-mobile { padding-bottom: 74px !important; }
          .chat-fab { bottom: 86px !important; }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: showNav ? 1040 : 860,
          background: "#fff",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(20,40,30,.18)",
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          minHeight: showNav ? 620 : undefined,
        }}
      >
        {/* device frame label */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: C.green,
            zIndex: 60,
          }}
        />
        {showNav && (
          <AppNav
            current={screen}
            go={go}
            unread={unreadCount}
            collapsed={navCollapsed}
            setCollapsed={setNavCollapsed}
            onHelp={() => setHelpSignal((n) => n + 1)}
          />
        )}
        <div className="app-content-pad-mobile" style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {screen !== "welcome" && history.length > 0 && (
            <button
              onClick={back}
              style={{
                position: "absolute",
                top: 13,
                left: 16,
                zIndex: 70,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1px solid ${C.line}`,
                background: "#fff",
                color: C.ink,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(20,40,30,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Go back"
              title="Back"
            >
              ←
            </button>
          )}
          {screens[screen]}
        </div>
        {showNav && <ChatBubble openSignal={helpSignal} />}
      </div>
    </div>
  );
}
