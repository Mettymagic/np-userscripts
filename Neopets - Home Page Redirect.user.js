// ==UserScript==
// @name         Neopets - Home Page Redirect <MettyNeo>
// @version      1.1
// @description  Simply redirects off the new homepage, for people who keep visiting it accidentally
// @author       Metamagic
// @match        *://*.neopets.com
// @match        *://*.neopets.com/
// @match        *://neopets.com
// @match        *://neopets.com/
// @match        *://*.neopets.com/index.phtml
// @match        *://neopets.com/index.phtml
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// @run-at       document-start
// ==/UserScript==

window.location.replace("https://www.neopets.com/home/")