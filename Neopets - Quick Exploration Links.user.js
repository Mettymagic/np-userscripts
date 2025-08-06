// ==UserScript==
// @name         Neopets - Quick Exploration Links <MettyNeo>
// @version      2025-08-06.0
// @description  Adds some quicklinks under the beta "Explore" button
// @author       Mettymagic
// @match        https://www.neopets.com/*
// @match        https://neopets.com/*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Quick%20Exploration%20Links.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Quick%20Exploration%20Links.user.js
// ==/UserScript==

//name, link, image
const LINK_LIST = [
    {
        name:"Inventory",
        link:"/inventory.phtml",
        img:"https://images.neopets.com/af13h43uw1/games/tm_3.png"
    },
    {
        name:"Quickref",
        link:"/quickref.phtml",
        img:"https://images.neopets.com/themes/h5/altadorcup/images/transferlog-icon.png"
    },
    {
        name:"Neopia Central",
        link:"/objects.phtml",
        img:"https://images.neopets.com/bestof/2008/neopiacentral.gif"
    },
    {
        name:"Hospital",
        link:"/hospital/volunteer.phtml",
        img:"https://images.neopets.com/themes/h5/basic/images/health-icon.png"
    },
    {
        name:"Barracks",
        link:"/dome/barracks.phtml",
        img:"https://images.neopets.com/themes/036_ddc_je4z0/events/battle_accept.png"
    }
]

let list = $("#exploredropdown__2020 > ul")[0]
LINK_LIST.forEach(row => {
    list.innerHTML += buildAnchor(row)
})

function buildAnchor(row) {
    return `<a href="${row.link}"><li>
                <div class="dropdown-icon" style="background-image: url(${row.img})"></div>
                <h4>${row.name}</h4>
            </li></a>`
}
