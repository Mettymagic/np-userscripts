// ==UserScript==
// @name         Neopets - Better Faster Godori <MettyNeo>
// @version      1.2
// @description  Greatly enhances the speed of the game by reducing delay and clicks required to play
// @author       Metamagic
// @match        https://www.neopets.com/games/godori/godori.phtml*
// @match        https://www.neopets.com/games/godori/index.phtml*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Better%20Faster%20Godori.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Better%20Faster%20Godori.user.js
// @icon         https://i.imgur.com/RnuqLRm.png
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

//TO-DO: card count display

//===============
// script options
//===============

const ACTION_DELAY = "0" //the delay in ms as a string. default: 1, unmodified fast speed is 500.

const CARD_SORT = "CAPTURE" //set to "SCORE" to sort hand by scoring category
const DISPLAY_HAND_PTS = true //shows the current hand's points
const DISPLAY_CARD_COUNTS = true //shows # of cards in capture categories, deck, and hands
const HIGHLIGHT_ON_HOVER = true //highlights cards of matching set when one is hovered
const SET_COLORS = true //distinguishes each set by border color
const COUNT_CARDS = true //make sure you don't get kicked out of the shenkuu palace for this one!

const SPEEDRUN_CLOCK = true //did this one for fun
//const RECORD_WINRATE = true //to know just how bad you are


//===============
// main functions
//===============

const CAPTURE_SETS = {
    "jan": 0, //shenkuu
    "feb": 1, //altador
    "mar": 2, //snow
    "apr": 3, //faerie
    "may": 4, //roo
    "jun": 5, //krawk
    "jul": 6, //tyrannia
    "aug": 7, //space
    "sep": 8, //island
    "oct": 9, //meridell
    "nov": 10, //desert
    "dec": 11 //haunted
}
const CAPTURE_SET_COLORS = {
    "jan": "#d47091",
    "feb": "#d18d3f",
    "mar": "#cae5ed",
    "apr": "#e6c5ed",
    "may": "#3862e0",
    "jun": "#46544f",
    "jul": "#8a7767",
    "aug": "#111112",
    "sep": "#219c3d",
    "oct": "#94110f",
    "nov": "#dbd82c",
    "dec": "#520e87"
}
const CARD_TYPE = {
    "1": 0,
    "2": 2,
    "3": 2, //fuckin weird lost desert card
    "t": 4, //banner
    "y": 6, //petpet
    "k": 8 //pet
}
const SET_MINS = {
    "bright": 3,
    "animal": 5,
    "ribbon": 5,
    "junk": 10
}
const IMG_REGEX = /.*?\/godori\/(.{3})(.{1}).*/

//redirect
if(window.location.href.includes("index.phtml")) {
    if(document.referrer.includes("godori.phtml")) {
        console.log("[BFG] Referred from game page, redirecting automatically.")
        $("#intro > tbody > tr:nth-child(2) > td > a")[0].click()
    }
}
//main game page
else {
    addCSS()
    setGameSpeed(ACTION_DELAY) //sets delay between actions
    sortHand() //sorts hand at start
    addListeners() //adds click listeners to hand to auto-click stack

    //if you have 10 cards in your hand, we're on a fresh hand
    var freshHand = $(`#player_hand > tbody > tr > td`).filter(function() {
        let element = $(this)
        return element.css('display') != "none"
    }).length == 10
    if(freshHand) resetData()

    //starts systems needed to track stats
    startGameStats()
    startGameObserver()

    //modifies ui
    if(SPEEDRUN_CLOCK) speedrunDisplay()
    if(DISPLAY_CARD_COUNTS) updateLabelDivs()
    if(HIGHLIGHT_ON_HOVER) addHighlightHover()
    if(SET_COLORS) highlightSetColor()
    console.log("[BFG] Page modifications applied.")
}

//===================
// speed / efficiency
//===================

function setGameSpeed(ms) {
    $("#fast")[0].value = ms //delay in ms between moves
    $("#fast")[0].click() //updates internal delay variable
    console.log(`[BFG] Action delay set to ${ms}ms.`)
}

//adds click listeners to cards in hand
function addListeners() {
    let cards = Array.from($("#player_hand > tbody > tr > td > div.g_container"))
    for(let card of cards) {
        card.addEventListener("click", (event)=>{
            //start speedrun timer
            if(SPEEDRUN_CLOCK && freshHand) {
                startTimer()
            }
            freshHand = false

            let set = card.querySelector("img").getAttribute("src").match(IMG_REGEX)[1]
            let stack = getSetStack(set)
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
        let stackset = stack.querySelector("img.g_card")?.getAttribute("src")?.match(IMG_REGEX)?.[1]
        if(set == stackset) return stack
        else if(!stackset && !emptystack) emptystack = stack
    }
    return emptystack
}

//===========
// game state
//===========

//resets stored data
function resetData() {
    GM_deleteValue("cardcount")
    GM_deleteValue("starttime")
}

//records cards to show up in the stack
function countCards(cards) {
    let cardcount = GM_getValue("cardcount", {})
    for(const card of cards) {
        if(!(card.set in cardcount)) cardcount[card.set] = [] //initializes if none of that set
        if(!cardcount[card.set].includes(card.type)) cardcount[card.set].push(card.type) //records only if not already recorded
    }
    GM_setValue("cardcount", cardcount)
}

//starts the systems that watch for updates in game state
let canAction = $("#game_status")[0].innerHTML.includes("Your move")
function startGameObserver() {
    //watches for changes in table's stacks to track cards seen
    for(const stack of Array.from($("#table_cards div.g_container"))) {
        const stackObs = new MutationObserver(mutations => {
            countCards(getStackCards(stack))
        })
        stackObs.observe(stack, {subTree: true, childList: true, attributes: true})
    }

    //watches for changes in status to track cards drawn
    let status = $("#game_status")[0]
    const statusObs = new MutationObserver(mutations => {
        //tracks cards in deck
        if(status.innerHTML == "You draw a card and play" || status.innerHTML.includes(" draws")) {
            let deck = GM_getValue("deckcount") - 1 //a card was drawn
            if(deck == 0) GM_deleteValue("deckcount") //resets when empty
            else GM_setValue("deckcount", deck) //otherwise updates
            if(status.innerHTML.includes(" draws")) sortHand()
        }

        //updates displays
        if(DISPLAY_HAND_PTS) updateHandPoints()
        if(DISPLAY_CARD_COUNTS) updateLabelDivs()
        if(HIGHLIGHT_ON_HOVER) addHighlightHover()
        if(SET_COLORS) highlightSetColor()

        //controls whether highlight shows
        if(HIGHLIGHT_ON_HOVER) {
            //can highlight
            if(status.innerHTML.includes("Your turn")) canAction = true
            //can't highlight, clears highlights
            else {
                canAction = false
                for(let hcard of Array.from($(".highlighted"))) hcard.classList.remove("highlighted")
            }
        }
    })
    statusObs.observe(status, {subTree: true, childList: true, characterData: true})
}

//counts cards on field, hand, and in deck
function startGameStats() {
    if(COUNT_CARDS && freshHand) {
        //records cards in hand
        countCards(getHandCards())
        //records cards on field
        for(const stack of Array.from($("#table_cards div.g_container"))) {
            countCards(getStackCards(stack))
        }
    }
    if(!GM_getValue("deckcount")) GM_setValue("deckcount", 20) //sets card count

    //continues speedrun timer on a refresh
    if(GM_getValue("starttime")) startTimer()

    //records points at start of round
    if(GM_getValue("deckcount") == 20 && DISPLAY_HAND_PTS) {
        GM_setValue("startpts", [$("#user_score > span > a")[0].innerHTML.split(" ")[1], $("#comp_score > span > a")[0].innerHTML.split(" ")[1]])
    }
    updateHandPoints()
}

//updates # of points earned in this round
function updateHandPoints() {
    let startpts = GM_getValue("startpts")
    let user = $("#user_score > span > a")[0]
    let opp = $("#comp_score > span > a")[0]
    user.innerHTML = `${user.innerHTML.split(":")[0]}: ${user.innerHTML.split(" ")[1] - startpts[0]} <small>(${user.innerHTML.split(" ")[1]})</small>`
    opp.innerHTML = `${opp.innerHTML.split(":")[0]}: ${opp.innerHTML.split(" ")[1] - startpts[1]} <small>(${opp.innerHTML.split(" ")[1]})</small>`
}

//=============
// display / ui
//=============

function highlightSetColor() {
    //fix stack z indexes
    let stacks = Array.from($("#table_cards .g_table_cell .g_container"))
    for(let stack of stacks) {
        let cards = Array.from(stack.querySelectorAll("img.g_card"))
        for(let card of cards) {
            card.style.zIndex = 200+(100*cards.indexOf(card))
        }
    }

    //adds border
    for(let card of Array.from($("#player_hand .g_card, #table_cards .g_table_cell .g_card"))) {
        if(card.nextSibling?.classList?.contains("sethighlight") != true) {
            let z = parseInt(card.style.zIndex) + 1
            let color = CAPTURE_SET_COLORS[card.src.match(IMG_REGEX)[1]]
            //needed to put the highlight at the proper location
            let prect = card.parentElement.getBoundingClientRect()
            let rect = card.getBoundingClientRect()
            $(card).after(`<div class="sethighlight" style="border-color:${color}; z-index:${z}; top:${rect.top-prect.top}; left:${rect.left-prect.left};"></div>`)
        }
    }
}

//highlights cards of the same set
function addHighlightHover() {
    //hovering hand
    $("#player_hand .g_container").mouseover(function() {
        if(!canAction) return
        //get all cards on table of same set
        let set = this.querySelector("img.g_card").src.match(IMG_REGEX)[1]
        let stackcards = Array.from($("#table_cards .g_container .g_card")).filter((card) => {return card.src.includes(set)})

        //adds highlight to last match
        if(stackcards.length > 0) {
            stackcards.slice(-1)[0].classList.add("highlighted")
        }
        //highlights empty stack
        else {
            $("#table_cards .g_empty_card")[0].classList.add("highlighted")
        }
    })
    $("#player_hand .g_container").mouseleave(function() {
        if(!canAction) return
        for(let hcard of Array.from($(".highlighted"))) hcard.classList.remove("highlighted")
    })

    //hovering stack
    $("#table_cards .g_container .sethighlight").mouseover(function() {
        //get all cards on hand of same set
        let set = this.parentElement.querySelector("img.g_card").src.match(IMG_REGEX)[1]
        let stackcards = Array.from($("#player_hand .g_container .g_card")).filter((card) => {return card.src.includes(set)})
        //adds highlight
        for(let card of stackcards) {
            card.classList.add("highlighted")
        }
    })
    $("#table_cards .g_container .sethighlight").mouseleave(function() {
        for(let hcard of Array.from($(".highlighted"))) hcard.classList.remove("highlighted")
    })
}

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

    //also "sorts" the opponents hand, thus centering it!)
    let opphand = $("#computer_hand > tbody > tr")[0]
    let emptyoppcards = Array.from(opphand.children).filter((td) => {return !(td.querySelector("div.g_container > img"))})
    opphand.parentElement.parentElement.style = `width: ${(10-emptyoppcards.length) * 70}px;`
    for(const card of emptyoppcards) {
        card.style.display = "none"
    }
}

//adds and updates the labels
function updateLabelDivs() {
    //deck
    //makes div if doesn't exist
    if($(".countlabel").length == 0) {
        let decklabel = document.createElement("div")
        decklabel.classList.add("countlabel")
        $("#stock")[0].appendChild(decklabel)
        //repositions deck because holy fuck why
        $("#stock")[0].style = "top:-70px; right:-20px; pointer-events:none; cursor:default;"
    }
    //updates label
    $(".countlabel")[0].innerHTML = GM_getValue("deckcount")

    //captures
    for(let div of Array.from($("#player_capture > tbody > tr > td > div")).concat(Array.from($("#computer_capture > tbody > tr > td > div")))) {
        //makes div if doesn't exist
        if(!div.querySelector(".caplabel")) {
            let caplabel = document.createElement("div")
            caplabel.classList.add("caplabel")
            div.appendChild(caplabel)
        }
        //updates label
        let label = div.querySelector(".caplabel")
        let cards = div.querySelectorAll("img.g_card_back").length
        label.innerHTML = `${cards}<small><small><small>/${SET_MINS[div.id.split("_")[1]]}</small></small></small>`
        //doesn't show label if nothing in capture category
        if(cards == 0) label.style.display = "none"
        else label.style.display = "flex"
    }

    //hands
    for(let hand of Array.from($("table.g_hand"))) {
        //makes div if it doesnt exist
        if(!hand.querySelector(".handlabel")) {
            let handlabel = document.createElement("div")
            handlabel.classList.add("handlabel")
            if(hand.id.includes("player")) handlabel.style.bottom = "-12px"
            else handlabel.style.top = "4px"
            hand.appendChild(handlabel)
        }
        let cards = Array.from(hand.querySelectorAll("td.g_card_cell")).filter((td)=>{return td.querySelector("div.g_container > img")}).length
        hand.querySelector(".handlabel").innerHTML = `Cards in Hand: ${cards}`
    }
}

//=====================
// speedrun timer (lol)
//=====================

//adds speedrun display to page
function speedrunDisplay() {
    //creates speedrun timer div
    let timer = document.createElement("td")
    timer.id = "speedruntimer"
    timer.innerHTML = "00:00<small>.000</small>"
    $(`#intro > tbody > tr`)[0].insertBefore(timer, $(`#intro > tbody > tr > td[align="right"]`)[0])
}

function startTimer() {
    //gets start time and updates timer automatically
    let starttime = GM_getValue("starttime") || {time:Date.now()} //keeps previous start time on page refresh
    let id = setInterval(() => {
        $("#speedruntimer")[0].innerHTML = formatTime(Date.now() - starttime.time)
    }, 12)
    GM_setValue("starttime", {time: starttime.time, id:id})
    console.log("[BFG] Timer started.")
}

function stopTimer() {
    clearInterval(GM_getValue("starttime").id)
}


//================
// cards / helpers
//================

//sorts by capture set
function compareCards(a, b) {
    return getCardValue(b.querySelector("div.g_container > img").getAttribute("src")) - getCardValue(a.querySelector("div.g_container > img").getAttribute("src"))
}

//gets "value" of card for sorting
function getCardValue(url) {
    let match = url.match(IMG_REGEX)
    if(CARD_SORT == "SCORE") return CAPTURE_SETS[match[1]] + CARD_TYPE[match[2]]*10
    else return CAPTURE_SETS[match[1]]*10 + CARD_TYPE[match[2]]
}

//returns list of cards from one of the twelve stacks
function getStackCards(stack) {
    let cardlist = []
    for(const card of Array.from(stack.querySelectorAll("img.g_card"))) {
        let match = card.getAttribute("src").match(IMG_REGEX)
        if(!match[0].includes("back.gif")) cardlist.push( {set:match[1], type:match[2]} )
    }
    return cardlist
}

//returns list of cards from hand
function getHandCards() {
    return Array.from( //gets hand as array
        $(`#player_hand > tbody > tr > td`).filter(function() {
            let element = $(this)
            return element.css('display') != "none"
        })
    ).map((td) => { //maps each card by set and type
        let match = td.querySelector("img.g_card").getAttribute("src").match(IMG_REGEX)
        return {set:match[1], type:match[2]}
    })
}

//pads a number with 0s at the front
function padNum(num, n) {
    let str = num.toString()
    while (str.length < n) str = "0" + str
    return str
}

//copied this from one of my python programs lol
//formats time as xx:xx.xxxs
function formatTime(t) {
    let ms = t //ms

    //find minutes
    let min = Math.floor(ms / 60000)
    ms -= min * 60000

    //find seconds
    let sec = Math.floor(ms / 1000)
    ms -= sec * 1000

    //ms is the leftover
    return `${padNum(min, 2)}:${padNum(sec, 2)}<small>.${padNum(ms, 3)}</small>`
}

function addCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
        #speedruntimer {
            vertical-align: bottom;
        }
        .countlabel {
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            bottom: -18px;
            left: 2px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
            background-color: rgba(255,204,0,0.95);
            pointer-events: none;
        }
        .caplabel {
            left: 0;
            top: 0;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            background-color: rgba(255,204,0,0.85);
            display: flex;
            position: absolute;
            z-index: 10000;
        }
        .handlabel {
            display: block;
            position: absolute;
            width: 130px;
            text-align: center;
            font-size: 9pt;
            font-weight: bold;
            left: 50%;
            padding: 2px 4px;
            transform: translateX(-50%);
            background-color: rgba(255,204,0,1);
            border-radius: 4px;
            pointer-events: none;
        }

        .handlabel {
            transition: 0.25s;
            opacity: 1.0;
            visibility: visible;
        }
        tbody:has(td.g_card_cell:hover) ~ .handlabel, .handlabel:hover {
            opacity: 0;
            visibility: hidden;
        }

        .sethighlight {
            display: block;
            position: absolute;
            box-sizing: border-box;
            width: 60px;
            height: 93px;
            border-style: solid;
            border-width: 8px;
        }
        .sethighlight::before {
            content: "";
            display: block;
            position: absolute;
            box-sizing: border-box;
            width: 48px;
            height: 81px;
            left: -2px;
            top: -2px;
            border-style: solid;
            border-width: 2px;
            border-color: rgba(0,0,0,0.2);
        }
        .sethighlight::after {
            content: "";
            display: block;
            position: absolute;
            box-sizing: border-box;
            width: 60px;
            height: 93px;
            left: -8px;
            top: -8px;
            border-style: solid;
            border-width: 2px;
            border-color: black;
        }

        #table_cards .g_container:has(.g_empty_card.highlighted)::after {
            content: "";
            display: block;
            position: absolute;
            box-sizing: border-box;
            width: 64px;
            height: 97px;
            border: solid 4px white;
            background-color: rgba(255,255,255,0.7);
            z-index: 3000;
        }

        .sethighlight:hover, .g_card.highlighted + .sethighlight {
            border-color: white !important;
            background-color: rgba(255,255,255,0.35);
            z-index: 1001 !important;
        }
        .g_card:has(+ .sethighlight:hover) {
            z-index: 1000 !important;
        }

        .g_hand, .g_capture, .g_card_cell {
            position: relative;
        }
    `
}