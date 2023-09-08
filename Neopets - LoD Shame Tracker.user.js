// ==UserScript==
// @name         Neopets - Lever of Doom Shame Tracker
// @version      1.2
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
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20LoD%20Shame%20Tracker.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20LoD%20Shame%20Tracker.user.js
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

if(window.location.href.includes("leverofdoom.phtml")) {
    //counts first pull
    if(GM_getValue("firstpull", false)) {
        let count = GM_getValue("pullcount", 0) //first load = count of 1
        count++
        GM_setValue("pullcount", count)
        GM_setValue("firstpull", false)
    }

    //displays pull count
    $("#container__2020 > p")[0].innerHTML += "<br><p><b>Lever Pulls:</b>&nbsp"+GM_getValue("pullcount", 1)+"<b> | </b>"+"<b>Neopoints Lost:</b>&nbsp"+(GM_getValue("pullcount", 1)*100).toLocaleString("en-US")+"<\p>"
    let np = $("#npanchor")[0].innerHTML.replaceAll(",", "")

    //displays fake avatar popup if you have the avvie
    if(GM_getValue("hasAvvie")) {
        let div = document.createElement("div")
        div.style="display:block;position:relative;margin:auto;"
        let img = document.createElement("img")
        img.src = "https://i.imgur.com/2y2bO34.png"
        img.width = "401"
        img.height = "90"
        img.style = "display:block;position:relative;margin:auto;"
        div.appendChild(img)
        let disc = document.createElement("div")
        disc.innerHTML = "(you can stop pulling now)"
        disc.style = "display:block;position:absolute;left:50%;bottom:0px;transform:translateX(-50%);color:black;width:200px;height:20px;"
        div.appendChild(disc)
        $("#container__2020")[0].insertBefore(div, $("#container__2020 > div.page-title__2020")[0])
        console.log("[LoD] Added fake event display.")
    }

    //doesnt count as refresh if any link on the page is clicked
    let linkClicked = false
    $("body").on("click", "a", function () {
        linkClicked = true
    })

    //each unload (aka refresh), count a pull
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

    //checks neoboards settings for if you have the avatar
    if(!GM_getValue("hasAvvie")) {
        console.log("Checking for avatar...")
        $.get("https://www.neopets.com/settings/neoboards/", function(data, status){
            let doc = new DOMParser().parseFromString(data, "text/html")
            //sometimes stackpath blocks the page, in which case open a newtab and close it after
            if(doc.title != "Neoboard Settings") {
                console.log("[APS] Neoboard Settings request blocked by stackpath. :(")
            }
            //find avvie from list
            let avvie = Array.from(doc.querySelectorAll("#SelectAvatarPopup > div.popup-body__2020 > div:nth-child(3) > div.settings-av")).find((div) => {return div.innerHTML.includes("Lever of Doom")})
            if(avvie) {
                GM_setValue("hasAvvie", true)
                console.log("[LoD] Lever of Doom avatar earned! Congrats!")
            }
            else console.log("[LoD] No avatar yet. Keep trying!")
        })
    }
}
else {
    GM_setValue("firstpull", true)
}