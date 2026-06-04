// ==UserScript==
// @name         Neopets - Virtupets Signal Jammer
// @namespace    http://tampermonkey.net/
// @version      2026-06-04
// @description  try to take over the world!
// @author       You
// @match        https://www.neopets.com/*
// @match        https://neopets.com/*
// @grant        none
// @icon         https://i.imgur.com/RnuqLRm.png
// @run-at       document-start
// ==/UserScript==

sessionStorage.setItem("ta_session_pv", -999999)
console.log("[VSJ] Jammed anti-adblock")

// back-up
document.head.appendChild(document.createElement("style")).innerHTML = `
.ta-ab-overlay {
    display: none !important;
}
`
