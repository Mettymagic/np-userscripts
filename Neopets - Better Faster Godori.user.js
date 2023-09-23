// ==UserScript==
// @name         Neopets - Better Faster Godori <MettyNeo>
// @version      1.1
// @description  Greatly enhances the speed of the game by reducing delay and clicks required to play
// @author       Metamagic
// @match        https://www.neopets.com/games/godori/godori.phtml
// @match        https://www.neopets.com/games/godori/index.phtml
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Better%20Faster%20Godori.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Better%20Faster%20Godori.user.js
// @icon         https://i.imgur.com/RnuqLRm.png
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

const CARD_SORT = "CAPTURE" //set to "SCORE" to sort hand by scoring category
const ACTION_DELAY = "0" //the delay in ms as a string. default: 1, unmodified fast speed is 500.

//redirects back to game page
if(window.location.href.includes("index.phtml")) {
    if(document.referrer.includes("godori.phtml")) {
        console.log("[BFG] Referred from game page, redirecting automatically.")
        $("#intro > tbody > tr:nth-child(2) > td > a")[0].click()
    }
}
//game modifications
else {
    let CAPTURE_SETS = {
        "jan": 0,
        "feb": 1,
        "mar": 2,
        "apr": 3,
        "may": 4,
        "jun": 5,
        "jul": 6,
        "aug": 7,
        "sep": 8,
        "oct": 9,
        "nov": 10,
        "dec": 11
    }
    let CARD_TYPE = {
        "1": 0,
        "2": 2,
        "t": 4, //banner
        "y": 6, //petpet
        "k": 8 //pet
    }

    $("#fast")[0].value = ACTION_DELAY //delay in ms between moves
    $("#fast")[0].click() //updates internal delay variable
    sortHand() //sorts hand at start
    addListeners() //adds click listeners to hand

    //sorts hand based on capture set
    function sortHand() {
        let hand = $("#player_hand > tbody > tr")[0]
        let cards = Array.from(hand.children).filter((td)=>{return td.querySelector("div.g_container > img")})
        let emptycardslots = Array.from(hand.children).filter((td) => {return !(td.querySelector("div.g_container > img"))})
        hand.parentElement.parentElement.style = `width: ${cards.length * 70}px;` //removes empty spaces in hand
        cards.sort(compareCards)

        //replace unsorted hand with sorted hand
        hand.innerHTML = ""
        for(const card of cards) {
            hand.appendChild(card)
        }
        for(const card of emptycardslots) {
            card.style.display = "none"
            hand.appendChild(card)
        }
        console.log("[BFG] Hand sorted.")
    }

    //sorts by capture set
    function compareCards(a, b) {
        return getCardValue(b.querySelector("div.g_container > img").getAttribute("src")) - getCardValue(a.querySelector("div.g_container > img").getAttribute("src"))
    }
    function getCardValue(url) {
        let match = url.match(/.*?\/godori\/(.{3})(.{1}).*/)
        if(CARD_SORT == "SCORE") return CAPTURE_SETS[match[1]] + CARD_TYPE[match[2]]*10
        else return CAPTURE_SETS[match[1]]*10 + CARD_TYPE[match[2]]
    }

    //adds click listeners to cards in hand
    function addListeners() {
        let cards = Array.from($("#player_hand > tbody > tr > td > div.g_container"))
        for(let card of cards) {
            card.addEventListener("click", (event)=>{
                let set = card.querySelector("img").getAttribute("src").match(/.*?\/godori\/(.{3})(.{1}).*/)[1]
                let stack = getSetStack(set)
                console.log("[BFG] Automatically selected stack for card.")
                stack.click()
                sortHand()
            })
        }
    }

    //finds the stack to place the card in
    function getSetStack(set) {
        let stacks = Array.from($("#top_row > td.g_table_cell > div.g_container")).concat(Array.from($("#bottom_row > td.g_table_cell > div.g_container")))
        let emptystack = null
        for(const stack of stacks) {
            let stackset = stack.querySelector("img.g_card")?.getAttribute("src")?.match(/.*?\/godori\/(.{3})(.{1}).*/)?.[1]
            if(set == stackset) return stack
            else if(!stackset && !emptystack) emptystack = stack
        }
        return emptystack
    }

    //note: i wanted to implement card counting but godori is broken and the imgs just break sometime so that wasnt really an option lol
}