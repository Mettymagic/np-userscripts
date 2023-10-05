// ==UserScript==
// @name         Neopets - NeoCola Enhancements <MettyNeo>
// @version      1.5.1
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

//TODO: display div instead of absolute, add ability to export data, resetting stored stuff and doing something w it, record avg rolls til transmog and # of transmogs
//TODO: use neocola2 and emulated requests to keep a queue of requests, allowing spammed requests to still be logged and create special display for it
        // - item queue of most recent x prizes, color-coded hehe

//==============
// script config
//==============

// https://web.archive.org/web/20210619183531/https://old.reddit.com/r/neopets/comments/o3mq8r/neocola_tokens/
const ENABLE_LEGAL_CHEAT = true // adds another index option, granting more neopoints as defined by u/neo_truths
const ALERT_ON_TRANSMOG = true // gives an alert when you earn a transmog prize to prevent accidentally refreshing past it
const BETTER_RESUBMIT = true //uses neocola2 and emulated requests to keep a queue of requests, allowing spammed requests to still be logged
    const START_TIMEOUT = 6000
    const RESUBMIT_TIMEOUT = 12000

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
    "Person Transmogrification Potion",
    "I Know Where You Live"
]
const CURSED_PRIZES = ["Transmogrification Lab Background", "A Beginners Guide to Mixing Transmogrification Potions", "Evil Transmogrification Potions"]

convertOldData()

//selection machine
if(window.location.href.includes("neocola2.phtml")) {
    addSelectCSS()
    if(!$("#content td.content")[0].innerHTML.includes("Sorry!  You don't have any NeoCola Tokens so you can't use the machine.  :(")) {
        let count = countTokenColors() //counts tokens
        GM_setValue("tokencount", count) //stores token count
        compressTokenDisplay(count) //compresses the giant token list
        modifyInputs() //cleans up and autofills inputs
        //displayStatOverview() //displays stats for all colors and individually
    }
}
else if(window.location.href.includes("neocola3.phtml")) {
    modifyPrizePage()
}

function modifyPrizePage() {
    addPrizeCSS()

    //records data
    GM_setValue("totalcount", GM_getValue("totalcount", 0) + 1)
    let input = GM_getValue("input")
    if(input) { //np stats require a known input combo to record / display
        //we used a token, increment it
        let n = GM_getValue("tokensused", 0)
        n += 1
        GM_setValue("tokensused", n)
        recordNP(input) //records np prize
    }
    recordItem() //records item prize

    //displays data
    if(input) displayTokenNPStats(input)
    displayItemStats()
    displayTransmogStats()
    $("#content td.content form > input[type=submit]")[0].value = "Run Awaaaaay!!!" //changes the text on the button to be a bit less misleading
    $("#content td.content form")[0].setAttribute("action", "neocola2.phtml") //brings to neocola2 instead of neocola1
    addSendButton()
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

//from the list of mystery brews!
function getRandomFlavor() {
    return FLAVOR_NAMES[Math.floor(Math.random() * FLAVOR_NAMES.length)]
}

//handles the token inputs
function modifyInputs() {
    //turns token display into input
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

    //autofills inputs
    //selects neocola flavor - higher index = more np
    let ncf = $(`select[name="neocola_flavor"]`)[0]
    //legal cheat adds new option and selects it
    if(ENABLE_LEGAL_CHEAT) {
        let ncf = $(`select[name="neocola_flavor"]`)[0]
        ncf.innerHTML += `<option value="421">${getRandomFlavor()}</option>`
        ncf.value = 421
        console.log("[NCE] Additional flavor option added.")
    }
    //otherwise chooses final index
    else ncf.value = 7

    //selects button presses - higher index = more np
    $(`select[name="red_button"]`)[0].value = 3

    //records what inputs were selected
    let submitted = false
    $("#content td.content > form input[type=submit]")[0].addEventListener("click", (event) => {
        //clears last run's use count
        if(!submitted) {
            GM_deleteValue("tokensused")
            //selected color
            let id = $(`select[name="token_id"] > option:selected`)[0].getAttribute("value")
            let color = Object.keys(TOKEN_IDS).find((c) => {return TOKEN_IDS[c] == id})
            //selected flavor
            let flavor = $(`select[name="neocola_flavor"] > option:selected`)[0].getAttribute("value")
            //# of presses
            let button = $(`select[name="red_button"] > option:selected`)[0].getAttribute("value")
            GM_setValue("input", {color: color, flavor: flavor, button: button})
            console.log(`[NCE] Remembered token input selections.`)
            if(BETTER_RESUBMIT) console.log("[NCE] Using better token submit system.")
        }
        if(BETTER_RESUBMIT) {
            sendRequest(START_TIMEOUT)
            event.preventDefault()
            event.stopPropagation()
        }
    })
}

//===========
// prize data
//===========

//code used from stackoverflow
//https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
function sortedInsert(array, value) {
    let low = 0, high = array.length

    while (low < high) {
        let mid = (low + high) >>> 1
        if (array[mid] < value) low = mid + 1
        else high = mid
    }
    return low
}

//i changed how data is stored so this makes sure data gets updated
function convertOldData() {
    let results = GM_getValue("results")
    if(results) {
        console.log("[NCE] Converting old data...")
        //initializes empty objects
        let items = {}

        //we assume they used the best flavor and button
        if(ENABLE_LEGAL_CHEAT) var f = 421
        else f = 7

        let np = {}
        np[`{"color":"red","flavor":"${f}","button":"3"}`] = {list:[], avg:null, total:0, count: 0}
        np[`{"color":"green","flavor":"${f}","button":"3"}`] = {list:[], avg:null, total:0, count: 0}
        np[`{"color":"blue","flavor":"${f}","button":"3"}`] = {list:[], avg:null, total:0, count: 0}

        let totalcount = 0

        let transmog = {prob: null, n_since: null, list:[]}

        let i = 0
        for(const color of Object.keys(TOKEN_IDS)) {
            //items
            let res = results[color]
            for(const item of Object.keys(res.items)) {
                let data = res.items[item]
                if(!Object.keys(items).includes(item)) items[item] = data //first of item, drag data in
                else items[item].count += data.count //not first, add count to existing data
            }

            //np
            let npkey = Object.keys(np)[i]
            np[npkey].list = res.np.sort((a, b) => a - b)
            np[npkey].avg = res.avg_np
            np[npkey].count = res.count
            np[npkey].total = res.np.reduce((a, b) => a + b, 0)
            totalcount += res.count

            i++
        }

        //transmog
        transmog.prob = results.prob
        transmog.n_since = results.n_since

        //saves in new data
        GM_setValue("item_res", items)
        GM_setValue("np_res", np)
        GM_setValue("transmog_res", transmog)
        GM_setValue("totalcount", totalcount)
        GM_deleteValue("results")
        console.log("[NCE] Data converted.")
    }
}

function recordNP(input) {
    let np = parseInt($("#content > table > tbody > tr > td.content > div[align='center'] > b:first-of-type")[0].innerHTML.replaceAll(",", ""))
    let np_res = GM_getValue("np_res", {}) //our previous results
    let npkey = JSON.stringify(input)
    //inserts in sorted place
    if(np_res[npkey]) sortedInsert(np_res[npkey].list, np)
    //initializes if empty
    else np_res[npkey].list = [np]

    //update average np by summing up total earnings and adding our current earnings
    if(np_res[npkey].avg) np_res[npkey].avg = (np_res[npkey].avg * np_res[npkey].count + np) / (np_res[npkey].count + 1)
    else np_res[npkey].avg = np

    if(np_res[npkey].total) np_res[npkey].total += np
    else np_res[npkey].total = np

    if(np_res[npkey].count) np_res[npkey].count += 1
    else np_res[npkey].count = 1

    GM_setValue("np_res", np_res)
}

function recordItem() {
    //item prize
    let itemname = $("#content td.content > div[align='center'] > b:last-of-type")[0].innerHTML
    let item_res = GM_getValue("item_res", {})
    //recorded before, increase count
    if(item_res[itemname]) item_res[itemname].count += 1
    //first of item, add data
    else item_res[itemname] = {count: 1, img: $("#content td.content > div[align='center'] > img:last-of-type")[0].src}
    GM_setValue("item_res", item_res)

    //inc. total count
    GM_setValue("totalcount", GM_getValue("totalcount", 0) + 1)

    //updates transmog odds based on item
    updateTransmogStats(itemname)
}

function calcProb(n) {
    return 1 - Math.pow((1 - 1/1000), n)
}

//calculates estimated probability of rolling a transmog on your next roll
function updateTransmogStats(name) {
    let results = GM_getValue("transmog_res", {n_since: 0, prob:0.0, list:[]})
    //increments rolls since
    results.n_since += 1

    //rolled transmog, record it!
    if(name.includes("Transmogrification")) {
        console.log(`[NCE] Transmogrification potion earned, congrats!`)
        let img = $("#content td.content > div[align='center'] > img:last-of-type")[0].src
        results.list.push({
            name: name,
            img: img,
            n_since: results.n_since,
            prob: calcProb(results.n_since)
        })
        GM_setValue("lasttransmog", img)
        if(ALERT_ON_TRANSMOG) window.alert("You just won a Transmogrification Potion!\n(Don't forget to take a screenshot!)")
        //reset the n_since
        results.n_since = 0
        results.prob = 0.0
    }
    //otherwise, update probability
    else {
        results.prob = calcProb(results.n_since)
    }

    GM_setValue("transmog_res", results)
}

//==============
// prize display
//==============

//displays stats for the specific input combo
function displayTokenNPStats(input) {
    let color = input.color
    let count = GM_getValue("tokencount")?.[color]
    let used = GM_getValue("tokensused")
    const np_res = GM_getValue("np_res")
    if(count && used && np_res) { //display only if our data didn't get wiped somehow
        let res = np_res[JSON.stringify(input)]
        let left = count - used
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
            <br><br>
            <u><b>${color.charAt(0).toUpperCase() + color.substr(1)} Token Stats:</b></u>
            <br>
            <b>Tokens Used:</b> ${(res.count).toLocaleString("en-US")}
            <br>
            <b>Avg. NP:</b> ${Math.round(res.avg).toLocaleString("en-US")} NP
            <br>
            <b>Highest NP:</b> ${Math.max(res.list.slice(-1)[0]).toLocaleString("en-US")} NP
        `
        $("#content td.content")[0].appendChild(countdiv)
        console.log(`[NCE] Token display added.`)
    }
}

//shows # of item collected
function displayItemStats() {
    const item_res = GM_getValue("item_res")
    if(item_res) { //schizochecking
        let nameelement = $("#content td.content > div[align='center'] > b:last-of-type")[0]
        let count = item_res[nameelement.innerHTML].count
        let cdiv = document.createElement("small")
        cdiv.innerHTML = `<br>(in case you're wondering, you've collected <b>${count}</b> of these!)`
        nameelement.after(cdiv)
    }
}

function displayTransmogStats() {
    const results = GM_getValue("transmog_res")
    let odddiv = document.createElement("div")
    odddiv.id = "estodds"

    let itemname = $("#content td.content > div[align='center'] > b:last-of-type")[0].innerHTML
    let img = GM_getValue("lasttransmog", "//images.neopets.com/items/pot_acara_mutant.gif")

    //to make sure we display the right numbers since we reset them prior
    if(itemname.includes("Transmogrification")) {
        let data = results.list.slice(-1)[0]
        odddiv.innerHTML = `
            <img src="${img}" width="40" height="40">
            <br>
            <b>Tokens Used:</b> ${data.n_since.toLocaleString("en-US")}
            <br>
            <b>Total Odds:</b> ${(data.prob*100.0).toLocaleString("en-US")}%
        `
    }
    else {
        odddiv.innerHTML = `
            <img src="${img}" width="40" height="40">
            <br>
            <b>Tokens Used:</b> ${results.n_since.toLocaleString("en-US")}
            <br>
            <b>Total Odds:</b> ${(results.prob*100.0).toLocaleString("en-US")}%
        `
    }
    $("#content td.content")[0].appendChild(odddiv)
}


//===================
// token use overhaul
//===================

function addSendButton() {
    let button = document.createElement("button")
    button.innerHTML = "Use Another Token!"
    button.addEventListener("click", () => {sendRequest(RESUBMIT_TIMEOUT)})
    $("#content td.content > div:first-of-type")[0].insertBefore(button, $(`#content td.content > div:first-of-type > form`)[0])
    button.after(document.createElement("br"), document.createElement("br"))
    button.focus()
    console.log("[NCE] Resubmit button added.")
}

let reqQueue = 0
function sendRequest(timeout) {
    let input = GM_getValue("input")
    if(input == null) return

    console.log("[NCE] Attempting to use token...")
    reqQueue += 1

    $.ajax({
        type: "POST",
        url: "/moon/neocola3.phtml",
        data: {token_id:TOKEN_IDS[input.color], neocola_flavor:input.flavor, red_button:input.button},
        timeout: timeout,
        success: function(data) {
            reqQueue -= 1
            let doc = new DOMParser().parseFromString(data, "text/html")
            if(doc.title != "NeoCola Machine") console.log("[NCE] POST request blocked by stackpath. :(")
            else readResponse(doc)
        },
        error: function(xhr, status, error) {
            console.log(status + error)
            reqQueue -= 1
        }
    }, {token_id:TOKEN_IDS[input.color], neocola_flavor:input.flavor, red_button:input.button}, function(data, status){
        let doc = new DOMParser().parseFromString(data, "text/html")
        //sometimes stackpath blocks the page :/
        if(doc.title != "NeoCola Machine") console.log("[NCE] POST request blocked by stackpath. :(")
    })
}

function readResponse(doc) {
    console.log("[NCE] Response received, recording and updating display.")
    console.log(doc)
    //on error
    if(doc.querySelector(".errorMessage")) {
        console.log(doc.querySelector(".errorMessage").innerHTML)
    }
    else {
        $("#content td.content")[0].innerHTML = doc.querySelector("#content td.content").innerHTML
        modifyPrizePage()
    }
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