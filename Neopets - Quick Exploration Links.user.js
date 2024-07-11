// ==UserScript==
// @name         Neopets - Quick Exploration Links <MettyNeo>
// @version      1.0
// @description  Adds some quicklinks under the beta "Explore" button
// @author       Mettymagic
// @match        https://www.neopets.com/*
// @match        https://neopets.com/*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// @downloadURL  https://github.com/Mettymagic/np-userscripts/blob/main/Neopets%20-%20Quick%20Exploration%20Links.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/blob/main/Neopets%20-%20Quick%20Exploration%20Links.user.js
// @run-at       document-start
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
        name:"Plot Hub",
        link:"/tvw",
        img:"https://images.neopets.com/neoboards/boardIcons/plot_tvw.png"
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

let explorePath = "body > div.nav-top__2020 > div.nav-top-grid__2020 > a.nav-explore-link__2020"
document.head.appendChild(document.createElement("style")).innerHTML = `
    ${explorePath}:hover .nav-explore__2020 > .nav-dropdown-arrow__2020 {
        transform: rotate(0deg);
    }
    ${explorePath} .nav-explore__2020 > .nav-dropdown-arrow__2020 {
        transform: rotate(-180deg);
    }

    ${explorePath} .nav-dropdown__2020 {
        display: none;
        position: absolute;
        width: 180px;
        left: 50%;
        top: calc(100%);
        margin-left: -90px;
        color: #000;
        max-height: calc(100vh - 100%);
        box-sizing: border-box;
        border-radius: 0 0 5px 5px;
    }
    ${explorePath}:hover .nav-dropdown__2020, .nav-dropdown__2020:hover {
        display: block;
    }

    ${explorePath} .nav-dropdown__2020 ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
    }
    ${explorePath} .nav-dropdown__2020 div {
        display: block;
        height: 100%;
        width: 30px;
        min-height: 30px;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
    }
    ${explorePath} .nav-dropdown__2020 ul a:hover {
        background-color: rgba(255,255,255,0.15);
        display: block;
    }
    ${explorePath} .nav-dropdown__2020 ul li {
        cursor: pointer;
        display: grid;
        width: 100%;
        grid-template-columns: 30px 1fr;
        grid-gap: 10px;
        align-items: center;
        justify-content: center;
        padding: 5px 5px 5px 10px;
        box-sizing: border-box;
        background-color: none;
    }
    ${explorePath} .nav-dropdown__2020 ul h4 {
        margin: 5px 0;
        font-family: "Cafeteria", 'Arial Bold', sans-serif;
        font-size: 13pt;
        letter-spacing: 0.5pt;
    }

    .nav-top-grid__2020 {
        grid-template-columns: auto 200px 120px 155px 105px 130px 140px 35px 35px 35px !important;
    }
`

window.addEventListener("DOMContentLoaded", function() {
    let bgcolor = $("#shopdropdown__2020").css("background-color")
    let color = $("#shopdropdown__2020").css("color")
    let border = $("#shopdropdown__2020").css("border")

    if($(explorePath).length > 0) {
        let explore = $(explorePath)[0]
        explore.classList.add("shopdropdown-button")
        let arrow = document.createElement("div")
        arrow.classList.add("nav-dropdown-arrow__2020")
        explore.querySelector("div").appendChild(arrow)

        let list = document.createElement("div")
        list.classList.add("nav-dropdown__2020")
        let html = "<ul>"
        LINK_LIST.forEach(row => {
            html += `
                <a href="${row.link}"><li>
                    <div style="background-image: url(${row.img})"></div>
                    <h4>${row.name}</h4>
                </li></a>
            `
        })
        html += "</ul>"
        list.innerHTML = html
        explore.appendChild(list)
    }

    document.head.appendChild(document.createElement("style")).innerHTML = `
        ${explorePath} .nav-dropdown__2020 {
            background-color: ${bgcolor};
            color: ${color};
            border: ${border};
        }
        ${explorePath} .nav-dropdown__2020 ul {
            background-color: ${bgcolor};
            border: ${border};
        }
        ${explorePath} .nav-dropdown__2020 ul h4 {
            color: ${color};
        }
    `
})