// ==UserScript==
// @name         Neopets - Home Page Redirect <MettyNeo>
// @version      1.0
// @description  Simply redirects off the new homepage, for people who keep visiting it accidentally
// @author       Metamagic
// @match        *://*.neopets.com
// @match        *://*.neopets.com/
// @match        *://neopets.com
// @match        *://neopets.com/
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// @run-at       document-start
// ==/UserScript==

window.location.replace("https://www.neopets.com/home/")