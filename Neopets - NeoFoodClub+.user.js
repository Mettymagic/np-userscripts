// ==UserScript==
// @name         Neopets - NeoFoodClub+ <MettyNeo>
// @version      1.1
// @description  Adds some improvements to neofood.club including remembering bet status, unfocusing tabs and auto-closing tabs.
// @author       Metamagic
// @match        *neofood.club/*
// @match        https://www.neopets.com/pirates/foodclub.phtml?type=bet*
// @match        https://www.neopets.com/pirates/process_foodclub.phtml?*&type=bet*
// @match        https://www.neopets.com/pirates/foodclub.phtml?type=current_bets*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant window.focus
// @grant window.close
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

//===============
// script options
//===============

const AUTOCLOSETABS = true //automatically closes bet tabs
const FORCEBGTAB = true //forces new tabs to be in the background
const AUTOMAXBET = true //automatically fills max bet value
const AUTOCOLLECTMAXBET = true //grabs the max bet from the neo food club page for convenience
const AUTOCOLLECT_TIMEOUT = 120 //autocollected data times out after this many minutes (default: 2hr)
const ADD_NEO_LINKS = true //adds some quick links to neopets food club pages for convenience
//const SETCOOKIEONBET = true //creates a browser cookie after submitting bets, used for Food Club Reminder script. Harmless even if not using it.


//============================
// css because react is stupid
//============================

function addCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
    /* green button */
    .css-1a4vxth[disabled], .css-1a4vxth[aria-disabled="true"], .css-1a4vxth[data-disabled] {
        opacity: 0.4;
        box-shadow: var(--chakra-shadows-none);
        cursor: auto;
    }

    /*grey button*/
    .css-1t3af2r {
        display: inline-flex;
        appearance: none;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-pack: center;
        justify-content: center;
        user-select: none;
        position: relative;
        white-space: nowrap;
        vertical-align: middle;
        outline: transparent solid 2px;
        outline-offset: 2px;
        width: 100%;
        line-height: 1.2;
        border-radius: var(--chakra-radii-md);
        font-weight: var(--chakra-fontWeights-semibold);
        transition-property: var(--chakra-transition-property-common);
        transition-duration: var(--chakra-transition-duration-normal);
        height: var(--chakra-sizes-8);
        min-width: var(--chakra-sizes-8);
        font-size: var(--chakra-fontSizes-sm);
        padding-inline-start: var(--chakra-space-3);
        padding-inline-end: var(--chakra-space-3);
        background: var(--chakra-colors-whiteAlpha-200);
    }
    .css-1t3af2r:disabled, .css-1t3af2r[data-hover] {
        background: var(--chakra-colors-whiteAlpha-300);
        cursor: not-allowed;
    }
    /* red button*/
    .css-ejxey[disabled], .css-ejxey[aria-disabled="true"], .css-ejxey[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: var(--chakra-shadows-none);
    }
    .css-ejxey {
        display: inline-flex;
        appearance: none;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-pack: center;
        justify-content: center;
        user-select: none;
        position: relative;
        white-space: nowrap;
        vertical-align: middle;
        outline: transparent solid 2px;
        outline-offset: 2px;
        width: 100%;
        line-height: 1.2;
        border-radius: var(--chakra-radii-md);
        font-weight: var(--chakra-fontWeights-semibold);
        transition-property: var(--chakra-transition-property-common);
        transition-duration: var(--chakra-transition-duration-normal);
        height: var(--chakra-sizes-8);
        min-width: var(--chakra-sizes-8);
        font-size: var(--chakra-fontSizes-sm);
        padding-inline-start: var(--chakra-space-3);
        padding-inline-end: var(--chakra-space-3);
        background: var(--chakra-colors-red-200);
        color: var(--chakra-colors-gray-800);
    }
    `
}

//================
// food club dicts
//================

const ARENA_NAMES = {
    1: "Shipwreck",
    2: "Lagoon",
    3: "Treasure Island",
    4: "Hidden Cove",
    5: "Harpoon Harry's"
}
const ARENA_IDS = Object.fromEntries(Object.entries(ARENA_NAMES).map(a => a.reverse()))

const PIRATE_NAMES = {
    1: "Dan",
    2: "Sproggie",
    3: "Orvinn",
    4: "Lucky",
    5: "Edmund",
    6: "Peg Leg",
    7: "Bonnie",
    8: "Puffo",
    9: "Stuff",
    10: "Squire",
    11: "Crossblades",
    12: "Stripey",
    13: "Ned",
    14: "Fairfax",
    15: "Gooblah",
    16: "Franchisco",
    17: "Federismo",
    18: "Blackbeard",
    19: "Buck",
    20: "Tailhook",
};
const PIRATE_IDS = Object.fromEntries(Object.entries(PIRATE_NAMES).map(a => a.reverse()))

//===============
// main functions
//===============

//applies changes to neofood.club
if(window.location.href.includes("neofood.club")) {
    addCSS()
    waitForBetTable()
}
//records max bet value from neopets food club page
else if(window.location.href.includes("neopets.com/pirates/foodclub.phtml?type=bet") && AUTOCOLLECTMAXBET) {
    let maxbet = $("#content > table > tbody > tr > td.content > p:nth-child(7) > b")[0].innerHTML
    let date = new Date().toLocaleString("en-US", {timeZone: "PST"})
    GM_setValue("maxbet", {maxbet:maxbet, date:date})
    console.log("[NFC+] Max bet value recorded.")
}

//processing bet page - if the page loads at this url it's an error
else if(window.location.href.includes("neopets.com/pirates/process_foodclub.phtml")) {
    if($(".errorMessage").length > 0) {
        let url = window.location.href
        let tabinfo = GM_getValue("tabinfo", {})

        //if url is marked, return error and close tab
        if(url in tabinfo) {
            let error = GM_getValue("betstatus", {})
            let betnum = tabinfo[url]
            if($(".errorMessage")[0].innerHTML.includes("you cannot place the same bet more than once!")) {
                error[tabinfo[url]] = "Already placed!"
            }
            else {
                error[tabinfo[url]] = "Invalid bet!"
            }
            GM_setValue("betstatus", error)
            console.log("[NFC+] Bet error status returned.")
            if(AUTOCLOSETABS) window.close()
        }
    }
}

//result page - record bets
else if(window.location.href.includes("neopets.com/pirates/foodclub.phtml?type=current_bets")) {
    let newBet = parseCurrentBets()
    if(AUTOCLOSETABS && newBet) window.close()
    //appends current bet count to current bets page for convenience
    let betCount = Array.from($("#content > table > tbody > tr > td.content > center:nth-child(6) > center:nth-child(2) > table tr[bgcolor='white']")).filter(r => r.children.length == 5).length
    $("#content > table > tbody > tr > td.content > center:nth-child(6) > center:nth-child(2) > table > tbody > tr:nth-child(1) > td > font")[0].innerHTML += ` <b>(${betCount})</b>`
}

//==================
// program launching
//==================

//waits for the right conditions to apply the changes of the script
function waitForBetTable() {
    //the table we want already exists, wait for it to finish populating
    let table = getBetTable()
    if(table) {
        const settableobs = new MutationObserver(mutations => {
            if(table.rows[1].children.length == 14) {
                console.log("[NFC+] Applying userscript to bet table...")
                handleNeoFoodMods()
                watchForBetTable()
            }
        })
        settableobs.observe(table, {subTree: true, childList: true});
    }
    //the table we want doesn't exist, wait for it to exist
    else watchForBetTable()
}

//watches for the addition/removal of the main bet table on the page
function watchForBetTable() {
    let page = $("#root > div")[0]
    const pageobs = new MutationObserver(mutations => {
        //if table is added, apply
        for(const mutation of mutations) {
            if(mutation.addedNodes.length > 0) {
                if(mutation.addedNodes[0] == getBetTable().parentElement) {
                    console.log("[NFC+] Applying userscript to bet table...")
                    handleNeoFoodMods()
                    break
                }
            }
        }
    })
    pageobs.observe(page, {subTree: true, childList: true});
}

//runs the main functionality of the script
function handleNeoFoodMods() {
    updateRound() //updates stored round #, which resets some things
    updateSetStatus() //updates set status if shit changes
    handleBetButtons() //updates place bet buttons
    updateMaxBet() //updates the max bet value in the header
    applyMaxBetValue() //presses the set all max bet button
    if(ADD_NEO_LINKS) addNeoLinks()
}

function updateRound() {
    let resetMsg = null

    //if new round
    let prevRound = GM_getValue("round", null)
    let currRound = $("#root > header > div > div.css-1g2m7qa > div > div.chakra-stack.css-11r82tl > div.chakra-input__group.css-4302v8 > div.chakra-numberinput.css-5vz1f0")[0].getAttribute("value")
    if(currRound != prevRound) {
        GM_setValue("round", currRound) //and update the current round
        resetMsg = "New round detected, cleared stored bet info."
    }

    //if new bet url
    let prevURL = GM_getValue("beturl", null)
    let currURL = window.location.href.match(/.*&b=(\w*).*?/)[1]
    if(prevURL != currURL) {
        GM_setValue("beturl", currURL) //and update the current round
        resetMsg = "New bet URL detected, cleared stored bet info."
    }

    //if either changed, reset stuff
    if(resetMsg != null) {
        GM_deleteValue("tabinfo")
        GM_deleteValue("betstatus")
        GM_deleteValue("placedbets")
        console.log("[NFC+] "+ resetMsg)
    }
}

function parseCurrentBets() {
    let currentbets = Array.from($("#content > table > tbody > tr > td.content > center:nth-child(6) > center:nth-child(2) > table tr[bgcolor='white']")).filter(r => r.children.length == 5)
    //only updates stored bet list if there are new bets detected (to deal with out-of-order loading)
    if(GM_getValue("placedbets", []).length < currentbets.length) {
        let betList = []
        let closeTab = false
        //parse each row
        for(const row of currentbets) {
            //dict of 5 arenas and their betters
            let bets = row.children[1].innerHTML
                .replaceAll('"', "").replaceAll("<b>", "").replaceAll("</b>", "").split("<br>").slice(0, -1)
            //parses bet info
            let betmap = {1:null,2:null,3:null,4:null,5:null}
            for(const bet of bets) {
                let s = bet.split(":")
                //get arena number
                let arena = ARENA_IDS[s[0]]
                //get pirates partial name
                for(const piratename of Object.values(PIRATE_NAMES)) {
                    if(s[1].includes(piratename)) {
                        var pirate = piratename
                        break
                    }
                }
                //add to betmap
                betmap[arena] = pirate
            }
            betList.push(betmap)
        }
        //update global value
        GM_setValue("placedbets", betList)
        console.log("[NFC+] Current bets list updated.")
        return true
    }
    return false
}


//==============
// apply max bet
//==============

//updates max bet value in header field
function updateMaxBet() {
    if(AUTOCOLLECTMAXBET) {
        let maxbetdata = GM_getValue("maxbet", null)
        if(maxbetdata != null) {
            let currDate = new Date()
            let collectionDate = new Date(maxbetdata.date)
            let mindiff = (currDate.getTime() - collectionDate.getTime())/1000/60

            if(mindiff < AUTOCOLLECT_TIMEOUT) {
                let input = $("#root > header > div > div.css-1g2m7qa > div > div.chakra-stack.css-11r82tl > div.chakra-skeleton> div > div.chakra-numberinput.css-5vz1f0 > input")[0]
                if(input.value < maxbetdata.maxbet) {
                    input.focus()
                    input.value = maxbetdata.maxbet
                    input.setAttribute("aria-valuenow", maxbetdata.maxbet)
                    input.setAttribute("aria-valuetext", maxbetdata.maxbet)
                    input.parentElement.value = maxbetdata.maxbet
                    input.blur()
                    console.log("[NFC+] Stored max bet value applied.")
                }
                //otherwise does nothing.
                else console.log("[NFC+] Max bet value less than current value, no update.")
            }
            //timed out
            else {
                console.log("[NFC+] Max bet value timed out, data invalidated.")
            }
            GM_deleteValue("maxbet")
        }
    }
}

//presses the 'set bet amounts to max' button
function applyMaxBetValue() {
    if(AUTOMAXBET) {
        let button = Array.from($("#root > div > div > div button")).filter(b => b.textContent == "Set bet amounts to max")[0]
        if(button) {
            button.click()
            console.log("[NFC+] Bets automatically set to max value.")
        }
    }
}

function addNeoLinks() {
    let cont = $("#root > div > div.css-1m39luo, #root > div > div.css-18xdfye")[0]
    let linkCont = document.createElement("div")
    linkCont.classList.add("css-cpjzy9")
    let linkCont2 = document.createElement("div")
    linkCont2.classList.add("chakra-stack", "css-n21gh5")

    let button1 = document.createElement("button")
    button1.type = "button"
    button1.classList.add("chakra-button", "css-178homt")
    let button2 = button1.cloneNode()
    button1.innerHTML = "Current Bets"
    button1.addEventListener("click", () => { window.open('https://www.neopets.com/pirates/foodclub.phtml?type=current_bets') })
    button2.innerHTML = "Collect Winnings"
    button2.addEventListener("click", () => { window.open('https://www.neopets.com/pirates/foodclub.phtml?type=collect') })

    linkCont2.appendChild(button1)
    linkCont2.appendChild(button2)
    linkCont.appendChild(linkCont2)
    cont.appendChild(linkCont)

}


//===========
// bet button
//===========

function handleBetButtons() {
    //updates button status
    updateButtonStatus()

    //updates existing table
    for(let row of Array.from(getBetTable().children[1].getElementsByTagName("tr"))) {
        let button = row.children[13].children[0]
        addButtonObserver(button.parentElement)
        if(!button.disabled) addButtonListener(button)
    }

    //observes updates in table to apply updates
    addRowObserver()
    //listens for outcomes after placing bets
    addResultsListeners()
}

//listens for added/removed rows
function addRowObserver() {
    let tbody = getBetTable().children[1]
    const tbodyobs = new MutationObserver(mutations => {
        for(const mutation of mutations) {
            if(mutation.addedNodes.length > 0) {
                let button = mutation.addedNodes[0].children[13].children[0]
                addButtonObserver(button.parentElement)
                if(!button.disabled) addButtonListener(button)
                applyMaxBetValue()
            }
        }
    })
    tbodyobs.observe(tbody, {childList: true})
}

function addResultsListeners() {
    //updates successful bet statuses based on current bet page
    GM_addValueChangeListener("placedbets", function(key, oldValue, newValue, remote) {
        updateSetStatus()
    })

    //updates bet buttons based on bet status updates
    GM_addValueChangeListener("betstatus", function(key, oldValue, newValue, remote) {
        updateButtonStatus()
    })
}

//updates set statuses to match the current bets screen
function updateSetStatus() {
    let placedBets = GM_getValue("placedbets", [])
    let betStatus = GM_getValue("betstatus", {})
    for(const bet of placedBets) {
        let row = getRowFromCurrentBet(bet) //finds the row of the bet
        let betNum = row.children[0].getElementsByTagName("p")[0].innerHTML //finds the number from the row

        betStatus[betNum] = "Bet placed!"
    }
    GM_setValue("betstatus", betStatus)
}

//updates the buttons to match their bet status
function updateButtonStatus() {
    let betStatus = GM_getValue("betstatus", {})
    for(const betNum in betStatus) {
        let button = getBetRow(betNum).children[13].children[0]
        let statusMsg = betStatus[betNum]
        button.firstChild.data = statusMsg
        button.disabled = true
        if(statusMsg == "Already placed!" || statusMsg == "Invalid bet!") {
            button.classList.add("css-ejxey")
            button.classList.remove("css-1t3af2r")
            button.classList.remove("css-1a4vxth")
        }
        if(statusMsg == "Bet placed!") {
            button.classList.add("css-1a4vxth")
        }
    }
}

function addButtonObserver(buttonCell) {
    const rowobs = new MutationObserver(mutations => {
        for(const mutation of mutations) {
            //button updates by removing and creating a new one. apply updates to the new button.
            if(mutation.addedNodes.length > 0) {
                let newButton = mutation.addedNodes[0]
                if(!newButton.disabled) {
                    addButtonListener(newButton)
                }
            }
        }
    })
    rowobs.observe(buttonCell, {childList: true, subtree: true})
}

function addButtonListener(button) {
    let betNum = button.parentElement.parentElement.getElementsByTagName("p")[0].innerHTML
    button.addEventListener("click", function(event){onButtonClick(event, betNum, button)})
}

function onButtonClick(event, betNum, button) {
    //overrides behavior
    event.stopPropagation()
    //updates button
    button.firstChild.data = "Processing..."
    button.classList.remove("css-1a4vxth")
    button.classList.add("css-1t3af2r")
    button.disabled = true
    //generates link again... manually... and opens it in background
    let link = generate_bet_link(betNum)
    openBackgroundTab(link, betNum)
}

function generate_bet_link(betNum) {
    let urlString =
        "https://www.neopets.com/pirates/process_foodclub.phtml?";
    let betData = getBetData(betNum)
    let bet = betData.winners
    for (let i = 0; i < 5; i++) {
        if (bet[i] != null) {
            urlString += `winner${i + 1}=${bet[i]}&`;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (bet[i] != null) {
            urlString += `matches[]=${i + 1}&`;
        }
    }
    urlString += `bet_amount=${betData.bet_amount}&`;
    urlString += `total_odds=${betData.total_odds}&`;
    urlString += `winnings=${betData.winnings}&`;
    urlString += "type=bet";
    return urlString;
}

function openBackgroundTab(url, betNum) {
    //opens tab
    if(FORCEBGTAB) {
        window.open(url, "_blank")
        window.focus()
        console.log("[NFC+] Forced new tab to back.")
    }
    else window.open(url)

    //records info abt the tab so the program knows it was pressed from here
    let tabinfo = GM_getValue("tabinfo", {})
    tabinfo[url] = betNum
    GM_setValue("tabinfo", tabinfo)
}


//=================
// helper functions
//=================

function getBetTable() {
    let t = document.querySelectorAll(".css-1l4tbns table.chakra-table.css-t1gveh")
    if(t.length > 0) {
        let last = Array.from(t).slice(-1)[0]
        if(last.querySelector("th").innerHTML == "Bet #") return last
    }
}

function getBetData(betNum) {
    let betRow = getBetRow(betNum)

    let bet_amount = betRow.children[1].children[0].getAttribute("value")
    let total_odds = betRow.children[2].innerHTML.split(":")[0]
    let winnings = betRow.children[3].innerHTML.replace(",", "")
    let winners = []
    for(let i=8; i<13; i++) {
        let pirate = betRow.children[i].innerHTML || null
        if(pirate != null) pirate = PIRATE_IDS[pirate]
        winners.push(pirate)
    }

    return {bet_amount:bet_amount, total_odds:total_odds, winnings:winnings, winners:winners}
}


function getBetRow(betNum) {
    let table = getBetTable()
    let tbody = table.children[1]
    let rows = Array.from(tbody.getElementsByTagName("tr"))
    let betRow = rows.filter(row=>{
        let num = row.children[0].getElementsByTagName("p")[0].innerHTML
        return num == betNum
    })[0]
    return betRow
}

function getRowFromCurrentBet(bet) {
    let rows = Array.from(getBetTable().children[1].getElementsByTagName("tr"))
    let i = 0
    for(const row of rows) {
        let match = true
        for(let i = 0; i < 5; i++) {
            if((row.children[8+i].innerHTML || null) != bet[i+1]) {
                match = false
                break
            }
        }
        if(match) return row
    }
    return null
}