// ==UserScript==
// @name         Neopets - NeoCola Enhancements <MettyNeo>
// @version      1.4
// @description  Improves the NeoCola machine by tracking results, improving the UI and enabling the "legal cheat".
// @author       Metamagic
// @match        https://www.neopets.com/moon/neocola2.phtml*
// @match        https://www.neopets.com/moon/neocola3.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20NeoCola%20Enhancements.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20NeoCola%20Enhancements.user.js
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

//TODO: add ability to export data, resetting stored stuff and doing something w it

//==============
// script config
//==============

// https://web.archive.org/web/20210619183531/https://old.reddit.com/r/neopets/comments/o3mq8r/neocola_tokens/
const AUTOFILL_INPUTS = true // autofills the best token selections
    const ENABLE_LEGAL_CHEAT = true // adds another index option, granting more neopoints as defined by u/neo_truths
const BETTER_SELECT_GUI = true // cleans the GUI of the selection page

const COLLECT_DATA = true // collects np earnings and prizes
    const DISPLAY_DATA = true //adds a simple display for recorded data
const DISPLAY_TOKEN_COUNT = true // displays # of tokens left on the prize page
const ESTIMATE_TRANSMOG_ODDS = true // estimates the odds of pulling a transmog given the number of attempts


//==============
// main function
//==============

const TOKEN_IDS = {"blue": 24538, "green":24539, "red":24540}
const FLAVOR_NAMES = [
    "Piss Water",
    "Can of WellCheers",
    "MUG Root Beer, 355mL",
    "Undefined Mystery Liquid",
    "Liquid Void",
    "Cursed Elixir",
    "Molten Plastic",
    "Healing Springs Bath Water",
    "gmuy flavor :3",
    "Wild Magic Surge",
    "Clarity",
    "...Don't Drink This",
    "Definitely Not Booze",
    "Butt Ooze",
    "Potion of Harming I",
    "Liquid NP",
    "Get Rich Quick Juice",
    "Diet Neocash",
    "Bone Hurting Juice",
    "Person Transmogrification Potion"
]
const EMPTY_RESULTS = {
    "red": {items:{}, np:[], avg_np:null, count: 0},
    "green": {items:{}, np:[], avg_np:null, count: 0},
    "blue": {items:{}, np:[], avg_np:null, count: 0},
    "prob": null,
    "n_since": 0
}
const CURSED_PRIZES = ["Transmogrification Lab Background", "A Beginners Guide to Mixing Transmogrification Potions", "Evil Transmogrification Potions"]

//selection machine
if(window.location.href.includes("neocola2.phtml")) {
    addSelectCSS()
    GM_deleteValue("color")
    GM_deleteValue("tokensused")
    let count = countTokenColors() //counts tokens
    if(DISPLAY_TOKEN_COUNT) GM_setValue("tokencount", count) //stores token count
    if(BETTER_SELECT_GUI) compressTokenDisplay(count) //compresses the giant token list
    modifyInputs() //cleans up and autofills inputs
}
else if(window.location.href.includes("neocola3.phtml")) {
    addPrizeCSS()
    let color = GM_getValue("color")
    if(color) { //needs to know what color to record under
        //increment tokens used
        if(DISPLAY_TOKEN_COUNT) {
            let n = GM_getValue("tokensused", 0)
            n += 1
            GM_setValue("tokensused", n)
        }
        if(COLLECT_DATA) recordPrize(color) //record prizes earned
    }
    if(ESTIMATE_TRANSMOG_ODDS) estimateTransmogOdds() //calculate estimated transmog odds for next roll
    modifyRewardsPage(color)
}


//==========
// selection
//==========

//gets the count of each token color
function countTokenColors() {
    let colors = {"red":0, "green":0, "blue":0}
    let display = $("#content > table > tbody > tr > td.content > div[align='center']")[0]
    let tokens = Array.from(display.children).slice(6)

    //count number of each token color
    for(const token of tokens) {
        //find which color it matches and increment it
        for(const color of Object.keys(colors)) {
            if(token.getAttribute("src").includes(color)) {
                colors[color] += 1
                break
            }
        }
    }
    console.log(`[NCE] Total tokens counted. ` + JSON.stringify(colors))
    return colors
}

//compresses the giant list of token displays by displaying count per color
function compressTokenDisplay(count) {
    let display = $("#content > table > tbody > tr > td.content > div[align='center']")[0]
    let machine = Array.from(display.children).slice(0, 6)

    //clear old token display
    display.innerHTML = ""
    //adds machine img back
    for(const e of machine) display.appendChild(e)

    //adds new token display
    let tokenDisplay = document.createElement("div")
    tokenDisplay.classList.add("token_display")
    for(const color of Object.keys(count)) makeTokenDisplay(tokenDisplay, color, count[color])
    display.appendChild(tokenDisplay)
    console.log(`[NCE] Token display compressed.`)
}

//makes one of the three token image and count displays
function makeTokenDisplay(display, color, count) {
    if(count > 0) {
        display.innerHTML += `<div value="${TOKEN_IDS[color]}" style="background-image:url(//images.neopets.com/items/sloth_token_${color}.gif);" class="token_img">
                                  <div class="token_count">x${count}</div>
                              </div>`
        if(color != "blue") display.innerHTML += "&nbsp;"
    }
}

function getRandomFlavor() {
    return FLAVOR_NAMES[Math.floor(Math.random() * FLAVOR_NAMES.length)]
}

//handles the token inputs
function modifyInputs() {
    //turns token display into input
    if(BETTER_SELECT_GUI) {
        //updates text
        $("#content > table > tbody > tr > td.content > div[align='center'] > b")[0].innerHTML = "What color will you use?"

        //button starts inactive
         $("#content td.content > form input[type=submit]")[0].disabled = true

        for(const d of Array.from($(".token_display")[0].children)) d.classList.add("inactive")

        //turns imgs into inputs
        for(const div of Array.from($(".token_display")[0].children)) {
            div.style.cursor = "pointer"
            div.addEventListener("click", ()=>{
                $(`select[name="token_id"]`).val(div.getAttribute("value"))
                //select token in form
                let tokens = Array.from($(".token_display")[0].children)
                //update active token
                for(const d of tokens) d.classList.add("inactive")
                div.classList.remove("inactive")
                //make submit button active again
                $("#content td.content > form input[type=submit]")[0].disabled = false
            })
        }

        //hides additional space
        $("#content > table > tbody > tr > td.content > b")[0].remove()
        $("#content > table > tbody > tr > td.content > form > table > tbody > tr:nth-child(1)")[0].style.visibility = "hidden"

        console.log(`[NCE] Compressed token display linked to form selection.`)
    }

    //autofills inputs
    if(AUTOFILL_INPUTS) {
        //selects neocola flavor - higher index = more np
        let ncf = $(`select[name="neocola_flavor"]`)[0]
        //legal cheat adds new option and selects it
        if(ENABLE_LEGAL_CHEAT) {
            let ncf = $(`select[name="neocola_flavor"]`)[0]
            ncf.innerHTML += `<option value="421">${getRandomFlavor()}</option>`
            ncf.value = 421
        }
        //otherwise chooses final index
        else ncf.value = 7

        //selects button presses - higher index = more np
        $(`select[name="red_button"]`)[0].value = 42

        console.log(`[NCE] Optimal selection options applied.`)
    }

    //records what color of token was selected
    if(DISPLAY_TOKEN_COUNT) {
        $("#content td.content > form input[type=submit]")[0].addEventListener("click", (event) => {
            //finds selected element
            let id = $(`select[name="token_id"] > option:selected`)[0].getAttribute("value")
            //get color from option value and record it
            let color = Object.keys(TOKEN_IDS).find((c) => {return TOKEN_IDS[c] == id})
            GM_setValue("color", color)
            console.log(`[NCE] Remembering ${color} token color selection.`)
        })
    }
}

//===========
// prize data
//===========

//records the np and item earned
function recordPrize(color) {
    //collects results from page#content > table > tbody > tr > td.content > div:nth-child(6) > b:nth-child(4)
    let np = parseInt($("#content > table > tbody > tr > td.content > div[align='center'] > b:first-of-type")[0].innerHTML.replaceAll(",", ""))
    let item = {
        name: $("#content > table > tbody > tr > td.content > div[align='center'] > b:last-of-type")[0].innerHTML,
        img: $("#content > table > tbody > tr > td.content > div[align='center'] > img:last-of-type")[0].src
    }

    let results = GM_getValue("results", EMPTY_RESULTS)
    let res = results[color]

    //stores prizes in results
    res.np.push(np)
    let item_res = res.items[item.name]
    if(item_res) { //if we've recorded this item before, increment count
        res.items[item.name].count += 1
        console.log(`[NCE] Recorded ${item.name} (total: ${res.items[item.name]})`)
    }
    else { //otherwise, add to object
        res.items[item.name] = {count: 1, img: item.img}
        console.log(`[NCE] Recorded first ${item.name} (total: 1)`)
    }

    //updates average np
    if(res.count > 0) res.avg_np = (res.avg_np*res.count + np) / (res.count + 1)
    else res.avg_np = np
    console.log(`[NCE] Calculated average NP earnings. (${res.avg_np} NP)`)

    //increments count
    res.count += 1
    GM_setValue("results", results)
    console.log(`[NCE] Total results recorded: ${res.count}`)
}

function calcProb(n) {
    return 1 - Math.pow((1 - 1/1000), n)
}

//calculates estimated probability of rolling a transmog on your next roll
function estimateTransmogOdds() {
    let results = GM_getValue("results", EMPTY_RESULTS)
    let name = $("#content > table > tbody > tr > td.content > div[align='center'] > b:last-of-type")[0].innerHTML

    //increments rolls since
    results.n_since += 1

    //rolled transmog, reset
    if(name.includes("Transmogrification")) {
        results.n_since = 0
        results.prob = calcProb(1)
        console.log(`[NCE] Transmogrification potion earned, est. probability reset.`)
    }
    //otherwise, update probability
    else {
        results.prob = calcProb(results.n_since + 1) //we're calculating the *next* probability so we add
        console.log(`[NCE] Updated est. probability. (${(results.prob*100.0).toFixed(3)}%)`)
    }

    GM_setValue("results", results)
}

//==============
// prize display
//==============

//adds some of the recorded stats to the rewards page
function modifyRewardsPage(color) {
    //displays tokens used / tokens left
    if(DISPLAY_TOKEN_COUNT) {
        let count = GM_getValue("tokencount")?.[color]
        let used = GM_getValue("tokensused")
        if(count && used) {
            let left = count-used
            let countdiv = document.createElement("div")
            countdiv.id = "tokensused"
            countdiv.innerHTML = `
                <img src="//images.neopets.com/items/sloth_token_${color}.gif" width="80" height="80">
                <br>
                <b>Starting Tokens:</b> ${count.toLocaleString("en-US")}
                <br>
                <b>Tokens Used:</b> ${used.toLocaleString("en-US")}
                <br>
                <b>Tokens Left:</b> ${left.toLocaleString("en-US")}
            `
            $("#content td.content")[0].appendChild(countdiv)
            console.log(`[NCE] Token display added.`)
        }
    }

    //adds np / item display
    if(COLLECT_DATA && DISPLAY_DATA) {
        const results = GM_getValue("results", EMPTY_RESULTS)
        const res = results[color]

        //shows # of that item collected
        let nameelement = $("#content > table > tbody > tr > td.content > div[align='center'] > b:last-of-type")[0]
        let count = res.items[nameelement.innerHTML].count
        let cdiv = document.createElement("small")
        cdiv.innerHTML = `<br>(in case you're wondering, you've collected <b>${count}</b> of these!)`
        nameelement.after(cdiv)

        //shows np stats
        $("#tokensused")[0].innerHTML += `
            <br><br>
            <u><b>${color.charAt(0).toUpperCase() + color.substr(1)} Token Stats:</b></u>
            <br>
            <b>Tokens Used:</b> ${res.count}
            <br>
            <b>Avg. NP:</b> ${Math.round(res.avg_np).toLocaleString("en-US")} NP
            <br>
            <b>Highest NP:</b> ${Math.max(...res.np).toLocaleString("en-US")} NP
        `
        console.log(`[NCE] Prize stat display added.`)
    }

    if(ESTIMATE_TRANSMOG_ODDS) {
        const results = GM_getValue("results", EMPTY_RESULTS)
        let odddiv = document.createElement("div")
        odddiv.id = "estodds"
        odddiv.innerHTML = `
            <img src="//images.neopets.com/items/pot_acara_mutant.gif" width="40" height="40">
            <br>
            <b>Tokens Since:</b> ${results.n_since.toLocaleString("en-US")}
            <br>
            <b>Est. Odds:</b> ${(results.prob*100.0).toLocaleString("en-US")}%
        `
        $("#content td.content")[0].appendChild(odddiv)
        console.log(`[NCE] Token display added.`)
    }

    $("#content > table > tbody > tr > td.content form > input[type=submit]")[0].value = "Go Back!"
}


//=========
// css
//=========

function addSelectCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
        div.token_img.inactive::after {
            content: "";
            width: 80px;
            height: 80px;
            display: block;
            position: relative;
            left: 0;
            top: 0;
            background-color: white;
            opacity: 0.3;
        }
        .token_img {
            display: inline-block;
            width: 80px;
            height: 80px;
            border: 1px solid black;
            position: relative;
        }
        .token_count {
            font-size: 10pt;
            font-weight: bold;
            display: block;
            position: absolute;
            right: 2px;
            bottom: 2px;
        }

        #content > table > tbody > tr > td.content > br:nth-last-of-type(2) {
            display: none;
        }
        #content > table > tbody > tr > td.content > br:nth-last-of-type(3) {
            display: none;
        }
    `
}

function addPrizeCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
        #tokensused {
            display: block;
            position: absolute;
            text-align: center;
            padding: 6px;
            border: 1px solid black;
            left: 7px;
            top: 30px;
            background-color: white;
        }
        #estodds {
            display: block;
            position: absolute;
            text-align: center;
            padding: 6px;
            border: 1px solid black;
            left: 7px;
            top: 250px;
            background-color: white;
        }
        #content td.content {
            position: relative;
        }
    `
}