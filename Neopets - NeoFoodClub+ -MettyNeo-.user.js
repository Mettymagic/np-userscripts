// ==UserScript==
// @name         Neopets - NeoFoodClub+ <MettyNeo>
// @version      0.3
// @description  Adds some optional minor improvements to neofood.club and serves as 1 of 2 components required for the Food Club Reminder script.
// @author       Metamagic
// @match        *neofood.club/*
// @match        https://www.neopets.com/pirates/foodclub.phtml?type=bet
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant window.focus
// @grant window.close
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

//TO-DO:
//-autoclose tabs
//-keep track of buttons pressed. when all buttons are pressed, bets complete.

//===============
// script options
//===============

const AUTOCLOSETABS = true //automatically closes bet tabs
const FORCEBGTAB = true //forces new tabs to be in the background
const AUTOMAXBET = true //automatically fills max bet value
const AUTOCOLLECTMAXBET = true //grabs the max bet from the neo food club page for convenience
const AUTOCOLLECT_TIMEOUT = 120; //autocollected data times out after this many minutes (default: 2hr)
const SETCOOKIEONBET = true //creates a browser cookie after submitting bets, used for Food Club Reminder script. Harmless even if not using it.


//============================
// css because react is stupid
//============================

function addCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
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
    .css-1t3af2r:hover, .css-1t3af2r[data-hover] {
        background: var(--chakra-colors-whiteAlpha-300);
    }
    `
}


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

//waits for the right conditions to apply the changes of the script
function waitForBetTable() {
    //the table we want already exists, wait for it to finish populating
    let table = getBetTable()
    if(table) {
        const settableobs = new MutationObserver(mutations => {
            if(table.rows[1].children.length == 14) {
                console.log("[NFC+] Bet table finished populating, applying userscript...")
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
                    console.log("[NFC+] Bet table added, applying userscript...")
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
    handleBetButtons() //updates place bet buttons
    updateMaxBet() //updates the max bet value in the header
    applyMaxBetValue() //presses the set all max bet button
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


//=================
// place bet button
//=================

function handleBetButtons() {
    if(FORCEBGTAB || AUTOCLOSETABS) { //dont bother if both options disabled
        let tbody = getBetTable().children[1]

        //updates existing table
        for(let row of Array.from(tbody.getElementsByTagName("tr"))) {
            let button = row.children[13].children[0]
            addButtonObserver(button.parentElement)
            if(!button.disabled) addButtonListener(button)
        }

        //listens for updates in table to apply updates
        addRowObserver()
    }
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
                updateMaxBet()
                console.log("[NFC+] New bet row detected, applied modifications.")
            }
        }
    })
    tbodyobs.observe(tbody, {childList: true})
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
    button.firstChild.data = "Bet placed!"
    button.classList.remove("css-1a4vxth")
    button.classList.add("css-1t3af2r")
    //generates link again... manually... and opens it in background
    let link = generate_bet_link(betNum)
    openBackgroundTab(link)
}

function openBackgroundTab(url) {
    //opens tab
    if(FORCEBGTAB) {
        window.open(url, "_blank")
        window.focus()
        console.log("[NFC+] Forced tab to back.")
    }
    else window.open(url)

    //records if tab should be auto closed
    if(AUTOCLOSETABS) {
        let toclose = GM_getValue("toclose", [])
        if(!toclose.includes(url)) {
            toclose.push(url)
            GM_setValue("toclose", toclose)
        }
        console.log("[NFC+] Marked tab to close.")
    }
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
    let table = getBetTable()
    let tbody = table.children[1]
    let rows = Array.from(tbody.getElementsByTagName("tr"))
    let betRow = rows.filter(row=>{
        let num = row.children[0].getElementsByTagName("p")[0].innerHTML
        return num == betNum
    })[0]

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

//the code in this section is modified from neofoodclub. original credit below.
//https://github.com/diceroll123/neofoodclub/blob/6ab45e2b3d19ed987af47788ce776b8cee0c8b93/src/app/components/PlaceThisBetButton.jsx#L64
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