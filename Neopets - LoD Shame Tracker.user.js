// ==UserScript==
// @name         Neopets - Lever of Doom Shame Tracker
// @version      1.0
// @description  Tracks the amount of money you have lost to the Lever of Doom.
// @author       Metamagic
// @match        *neofood.club/*
// @match        *://www.neopets.com/space/strangelever.phtml*
// @match        *://neopets.com/space/strangelever.phtml*
// @match        *://www.neopets.com/space/leverofdoom.phtml*
// @match        *://neopets.com/space/leverofdoom.phtml*
// @grant        GM_getValue
// @grant        GM_setValue
// @icon         https://i.imgur.com/RnuqLRm.png
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

if(window.location.href.includes("leverofdoom.phtml")) {
    //first pull
    if(GM_getValue("firstpull", false)) {
        let count = GM_getValue("pullcount", 0) //first load = count of 1
        count++
        GM_setValue("pullcount", count)
        GM_setValue("firstpull", false)
    }

    //display
    $("#container__2020 > p")[0].innerHTML += "<br><p><b>Lever Pulls:</b>&nbsp"+GM_getValue("pullcount", 1)+"<b> | </b>"+"<b>Neopoints Lost:</b>&nbsp"+(GM_getValue("pullcount", 1)*100).toLocaleString("en-US")+"<\p>"
    let np = $("#npanchor")[0].innerHTML.replaceAll(",", "")

    //np tracker - for debugging
    let npdiff = GM_getValue("startnp", 0) - np + 100
    let diff = GM_getValue("npdiff", 0)
    diff += npdiff
    GM_setValue("npdiff", diff)
    console.log(`Est. ${GM_getValue("pullcount", 1)*100} vs Act. ${npdiff}`)

    let linkClicked = false
    //doesnt count as refresh if any link on the page is clicked
    $("body").on("click", "a", function () {
        linkClicked = true
    })

    //beforeunload
    window.addEventListener("beforeunload", (e) => {
        if(!linkClicked) {
            //increments refresh count
            let count = GM_getValue("pullcount", 1)
            count++
            GM_setValue("pullcount", count)
            //updates count right then
            $("#container__2020 > p > p:nth-child(3)")[0].innerHTML = "<b>Lever Pulls:</b>&nbsp"+count+"<b> | </b>"+"<b>Neopoints Lost:</b>&nbsp"+(count*100).toLocaleString("en-US")
        }
    })
}
else {
    let startNP = $("#npanchor")[0].innerHTML.replaceAll(",", "")
    GM_setValue("startnp", startNP)
    console.log(startNP)
    GM_setValue("firstpull", true)
}