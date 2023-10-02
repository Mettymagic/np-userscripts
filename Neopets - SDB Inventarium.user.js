// ==UserScript==
// @name         Neopets - SDB Inventarium <MettyNeo>
// @version      0.1
// @description  Allows you to view all SDB items at once, displaying additional info and allowing for more detailed search and sorts.
// @author       Metamagic
// @match        https://www.neopets.com/safetydeposit.phtml*
// @match        https://www.neopets.com/inventory.phtml*
// @match        https://www.neopets.com/quickstock.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* TO-DO:
 - compat with sdb dump script
 - display
     - display override on main page
          - item display - variable row size & detail lvls
     - 'back to vanilla' button
     - page selection / offset - variable page size
          - gui for moving pages
     - sorting system
          - gui for sort
     - search system
          - gui for search
 - record custom sdb removes
*/

//some items have duplicate names and thus we can't determine which of two ids an item is from its name alone
const DUPLICATE_NAMES = [
    "Piece of a treasure map",
    "Spooky Treasure Map",
    "Space Map",
    "Candy Cane Sword",
    "Christmas Baby Blu",
    "Cloud Umbrella",
    "Counting Babaas",
    "Fire Umbrella",
    "Kass Basher Flag",
    "Lost Desert Palm Tree",
    "Lunch Tray",
    "Rainbow Umbrella",
    "Retired Altador Cup Mystery Capsule",
    "Retired Dyeworks Mystery Capsule",
    "Retired Wonderclaw Mystery Capsule",
    "Shining Star Gift Box",
    "Snowflake Garland",
    "Sparkling Yellow Mystery Capsule",
    "The Darkest Faerie (TCG)",
    "Usuki Dream Car",
    "Usuki Dream Jetski",
    "Yooyuball Tattoo",
    "Basic Gift Box"
]
let clicked = false //prevents double-inputs

const url = document.location.href
if(url.includes("safetydeposit.phtml")) {
    recordSDBPage()
    removeVanillaSDB()
}
else if(url.includes("quickstock.phtml")) {
    depositQuickStock()
}
else if(url.includes("inventory.phtml")) {
    depositInventory()
}

//this is technically illegal btw
//todo: remove this
function autoNavigate() {
    console.log("Attempting to navigate to next page...")
    $("#content > table > tbody > tr > td.content > table > tbody > tr > td:nth-child(3) > a")?.[0]?.click()
}

//==============
// parsing pages
//==============

function recordSDBPage() {
    let rows = Array.from($("#content td.content > form > table:nth-of-type(2) > tbody > tr:not(:first-child):not(:last-child)"))
    console.log(`[SDB] Reading data for ${rows.length} items.`)
    let pagedata = {}
    for(const tr of rows) {
        let rowdata = parseRowData(tr)
        pagedata[JSON.stringify(rowdata[0])] = rowdata[1]
    }
    getItemDBData(pagedata)
}

function parseRowData(tr) {
    let name = tr.querySelector(" td:nth-child(2) > b").childNodes[0].nodeValue
    let img = tr.querySelector("td:nth-child(1) > img").getAttribute("src").match(/.*?images\.neopets\.com\/items\/(.+?)\..+/)[1]
    let desc = tr.querySelector("td:nth-child(3) > i").innerHTML
    let type = tr.querySelector("td:nth-child(4) > b").innerHTML
    let count = parseInt(tr.querySelector("td:nth-child(5) > b").innerHTML)
    let id = parseInt(tr.querySelector("td:nth-child(6) > input").getAttribute("name").match(/back_to_inv\[([0-9]+)\]/)[1])
    let tag = tr.querySelector("span.medText font") || null
    let searchhelper = tr.querySelector("td:nth-child(2) > p.search-helper") || null //for compatibility with dice's search helper script
    return [id,{name:name, image_id:img, desc:desc, category:type, count:count, tag: tag, searchhelper:searchhelper, id:id}]
}

function depositQuickStock() {
    let submit = $(`#content td.content > form tr:last-child input[type=submit]:nth-child(1)`)?.[0]
    if(submit) {
        submit.addEventListener("click", (event) => {
            //event.preventDefault()
            //event.stopPropagation()
            if(!clicked) {
                let selected = Array.from($(`form[name="quickstock"] tr:not(:nth-last-child(-n+2)) input:checked`)).slice(0,70) //quick stock can only do 70 at a time!
                let deposited = selected.filter((e) => {return e.value == "deposit"}).map((e) => {return e.parentElement.parentElement.querySelector("td:first-child").childNodes[0].nodeValue})
                if(deposited.length > 0) {
                    console.log(`[SDB] Recording deposit of ${deposited.length} items...`)
                    recordItemListToSDB(deposited)
                }
                clicked = true
            }
        })
        console.log("[SDB] Watching quick stock for deposits...")
    }
}

function depositInventory() {
    const resultObs = new MutationObserver((mutations) => {
        if($("#invResult > div.popup-body__2020 > p")[0].innerHTML.includes("into your safety deposit box!")) {
            //get name and img to identify item
            let name = $("#invResult > div.popup-body__2020 > p > b")[0].innerHTML
            let img = $("#invResult > div.popup-body__2020 > div > img")[0].getAttribute("src").match(/.*?images\.neopets\.com\/items\/(.+?)\..+/)[1]
            console.log(`[SDB] Recording ${name} deposit...`)

            //check if we already have info on this in sdb
            let res = Object.values(GM_getValue("sdbdata", {})).find((i) => {return i.name == name && i.image_id == img})
            //already have info, increment count
            if(res != null) {
                res.count += 1
                GM_setValue("sdbdata", res)
                console.log(`[SDB] Item count incremented.`)
            }
            //don't have info, get info from itemdb
            else getItemDBDataFromPair([name, img])
        }
    })
    resultObs.observe($("#invResult")[0], {characterData: true, childList: true, subtree: true})
    console.log("[SDB] Watching inventory for deposits...")
}

//necessary for if items are fully removed and need to be removed from the sdbdata list
function removeVanillaSDB() {
    //remove one - simply update count
    $("#content td.content > form > table:nth-child(3) > tbody").on("click", "td:nth-child(6) > a", function (event) {
        //event.stopPropagation()
        //event.preventDefault()
        if(!clicked) {
            let id = parseInt(this.parentElement.querySelector("input").getAttribute("name").match(/back_to_inv\[([0-9]+)\]/)[1])
            let sdb = GM_getValue("sdbdata", {})
            sdb[id].count -= 1
            console.log(`[SDB] Removed 1 ${sdb[id].name} from SDB.`)
            if(sdb[id].count == 0) delete sdb[id]
            GM_setValue("sdbdata", sdb)
            clicked = true
        }
    })
    //move selected items
    $("#content td.content > form input.submit_data")[0].addEventListener("click", (event) => {
        if(!clicked) {
            let changeditems = []
            for(const input of Array.from($("input.remove_safety_deposit"))) {
                let count = input.value
                //for each input that we're removing something from, decrease the count
                if(count > 0) {
                    let sdb = GM_getValue("sdbdata", {})
                    let id = input.getAttribute("name").match(/back_to_inv\[([0-9]+)\]/)[1]
                    sdb[id].count -= count
                    changeditems.push([sdb[id].name, count])
                    if(sdb[id].count == 0) delete sdb[id]
                    GM_setValue("sdbdata", sdb)
                }
            }
            if(changeditems.length > 0) {
                console.log("[SDB] The following items were removed:")
                for(const item of changeditems) console.log(`\t- ${item[0]} (x${item[1]})`)
            }
            clicked = true
        }
    })
}

//==============
// sdb item data
//==============

function savePageData(pagedata) {
    //saves data
    let sdbdata = GM_getValue("sdbdata", {})
    for(const item of Object.keys(pagedata)) {
        sdbdata[item] = pagedata[item]
    }
    GM_setValue("sdbdata", sdbdata)

    let items = Object.keys(sdbdata).length
    let qty = Object.values(sdbdata).reduce((a, b) => {return a + b.count}, 0)

    //shows item count recorded so far
    //todo: store these counts as a variable before page modifications
    if(url.includes("safetydeposit.phtml")) {
        let itemcounts = $("#content td.content > table > tbody > tr > td:nth-child(2)")[0].innerHTML.match(/<b>Items:<\/b> (.+?) \| <b>Qty:<\/b> (.+)/)
        console.log(`[SDB] SDB page recorded. (Items: ${items}/${itemcounts[1].replaceAll(",","")}, Qty: ${qty}/${itemcounts[2].replaceAll(",","")})`)
        //autoNavigate()
    }
    else console.log(`[SDB] SDB page recorded. (Items: ${items}, Qty: ${qty})`)
}

function recordItemListToSDB(itemnames) {
    let toitemdb = {}
    let uncertain = GM_getValue("uncertainitems", {})
    let sdbdata = GM_getValue("sdbdata", {})

    //handles each item to be deposited
    let updated = 0
    for(const name of itemnames) {
        let item = getSDBItemByName(name)
        if(Object.keys(item).length == 0) { //we don't have item info, let's grab it from itemdb
            if(toitemdb[name]) toitemdb[name] += 1
            else toitemdb[name] = 1
        }
        else if(item == null) { //multiple items with the same name, can't tell item without manual checking
            uncertain[name] = undefined
            console.log(`[SDB] WARNING: Can't determine item ID from item with duplicate name! (${name})`)
        }
        else {
            Object.values(sdbdata).find((i) => {return i.name == name}).count += 1 //increment count in sdb
            updated += 1
        }
    }

    GM_setValue("sdbdata", sdbdata)
    GM_setValue("uncertainitems", uncertain)

    if(updated > 1) console.log(`[SDB] Updated SDB item quantity for ${updated} deposited items.`)
    else if(updated == 1) console.log(`[SDB] Updated SDB item quantity for ${updated} deposited item.`)

    if(Object.keys(toitemdb).length > 0) getItemDBDataFromNames(toitemdb) //fetches data for items from db
}

function getSDBItemByName(name) {
    //can't be certain of items that share name, eg map pieces
    if(isDuplicateName(name)) return null
    return Object.values(GM_getValue("sdbdata", {})).find((i) => {return i.name == name}) || {}
}

function isDuplicateName(name) {
    return name.includes("Map Piece") || name.includes("Laboratory Map") || DUPLICATE_NAMES.includes(name)
}

//================
// itemdb requests
//================

function parseItemDBResponse(data, itemlist, pair=false) {
    if(Object.keys(data).length < itemlist.length) console.log(`[SDB] WARNING: ItemDB only returned ${Object.keys(data).length} items. Make sure to submit data to itemDB using their userscript!`)

    let pagedata = {}
    for(let name of Object.keys(data)) {
        let key = data[name].item_id
        pagedata[key] = {}
        pagedata[key].name = data[name].name
        pagedata[key].image_id = data[name].image_id
        pagedata[key].category = data[name].category
        pagedata[key].desc = data[name].description
        pagedata[key].tag = data[name].specialType
        pagedata[key].rarity = data[name].rarity
        pagedata[key].searchhelper = null
        pagedata[key].estVal = data[name].estVal
        pagedata[key].isNC = data[name].isNC
        pagedata[key].isWearable = data[name].isWearable
        pagedata[key].isNeohome = data[name].isNeohome
        pagedata[key].isNoTrade = data[name].status == "no trade"
        pagedata[key].priceData = data[name].price
        pagedata[key].owlsData = data[name].owls
        if(pair) pagedata[key].count = 1
        else pagedata[key].count = itemlist[name]
    }
    console.log(`[SDB] Item data for ${Object.keys(data).length} items grabbed from ItemDB. Thanks Magnetismo Times!`)
    savePageData(pagedata)
}

function getItemDBData(pagedata) {
    let itemlist = Object.keys(pagedata)
    $.get("https://itemdb.com.br/api/v1/items/many", {item_id:itemlist}, (data, status)=>{
        if(Object.keys(data).length < itemlist.length) console.log(`[SDB] WARNING: ItemDB only returned ${Object.keys(data).length} items, expected ${itemlist.length} items.`)
        for(const key of Object.keys(data)) {
            //adds data from itemdb
            pagedata[key].rarity = data[key].rarity
            pagedata[key].estVal = data[key].estVal
            pagedata[key].isNC = data[key].isNC
            pagedata[key].isWearable = data[key].isWearable
            pagedata[key].isNeohome = data[key].isNeohome
            pagedata[key].isNoTrade = data[key].status == "no trade"
            pagedata[key].priceData = data[key].price
            pagedata[key].owlsData = data[key].owls
        }
        console.log(`[SDB] Additional item data for ${Object.keys(data).length} items grabbed from ItemDB. Thanks Magnetismo Times!`)
        savePageData(pagedata)
    })
}

function getItemDBDataFromNames(itemlist) {
    console.log(`[SDB] Fetching item data from ItemDB for ${Object.keys(itemlist).length} items.`)
    $.get("https://itemdb.com.br/api/v1/items/many", {name:Object.keys(itemlist)}, (data) => {
        parseItemDBResponse(data, itemlist)
    })
}

function getItemDBDataFromPair(pair) {
    console.log(`[SDB] Fetching item data from ItemDB for ${pair[0]}.`)
    $.get("https://itemdb.com.br/api/v1/items/many", {name_image_id:[pair]}, (data) => {
        parseItemDBResponse(data, [pair[0]], true)
    })
}

/*
//back_to_inv%5B1%5D=1&back_to_inv%5B192%5D=1&obj_name=&category=0&offset=0
$.post("/process_safetydeposit.phtml?checksub=scan", "back_to_inv%5B1%5D=1&back_to_inv%5B478%5D=1&obj_name=&category=0&offset=0", (data, status) => {
        console.log("status: "+status)
    })
*/