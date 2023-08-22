// ==UserScript==
// @name         Neopets - Mystery Pic Helper <MettyNeo>
// @version      1.0
// @description  Adds Image Emporium quicklinks to the Mystery Pic page
// @author       Metamagic
// @match        *://*.neopets.com/games/mysterypic.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// ==/UserScript==

const SLOTH_ICON = `<img src="https://www.google.com/s2/favicons?sz=64&domain=drsloth.com" width="14" height="14" alt="Sloth Emporium Icon">`

let links = document.createElement("div")
links.classList.add("links")
links.innerHTML = `<a href="https://www.drsloth.com/search/?category=18&width=450&height=150" target="_blank">${SLOTH_ICON}Shopkeeper Banners</a><span><b>|</b></span>
<a href="https://www.drsloth.com/search/?category=71&width=667" target="_blank">${SLOTH_ICON}Game Icons</a> <span><b>|</b></span>
<a href="https://www.drsloth.com/search/?category=37" target="_blank">${SLOTH_ICON}World Images</a>`
$("#content > table > tbody > tr > td.content")[0].insertBefore(links, $("#content > table > tbody > tr > td.content > center:nth-child(5)")[0])

document.head.appendChild(document.createElement("style")).innerHTML = `
    .links {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .links > * {
        padding: 0px 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .links > a > img {
        padding-right: 4px;
    }
`

console.log("[MPH] Quicklinks added.")