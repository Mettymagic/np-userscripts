// ==UserScript==
// @name         Neopets - Quick Inventory Deposit <MettyNeo>
// @version      1.0
// @description  Adds a button that quickly deposits all items from your inventory into your SDB.
// @author       Metamagic
// @match        *://www.neopets.com/*
// @match        *://neopets.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @icon         https://i.imgur.com/RnuqLRm.png
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

//==============
// main function
//==============

//check for the top left pet icon to know we're in beta
let isBeta = false
if($("[class^='nav-pet-menu-icon']").length) isBeta = true

addButton() //adds button to page
addCSS() //adds css to page


//=================
// element creation
//=================

let clicked = false
function addButton() {
    let button = document.createElement("div")
    button.classList.add("invdumpbutton")
    button.id = "qid-button"

    button.addEventListener("click", (event)=>{
        if(!clicked) {
            clicked = true
            event.target.style.opacity = "0.6"
            event.target.style.cursor = "default"
            event.target.classList.add("working")
            $("#qid-status")[0].classList.add("working")
            requestQuickStock()
        }
    })

    let text = document.createElement("div")
    text.classList.add("invdumptext")
    text.id = "qid-status"
    text.innerHTML = "Empty to SDB"
    if(isBeta) {
        let bar = $("div.navsub-right__2020")[0]
        bar.insertBefore(text, bar.children[0])
        bar.insertBefore(button, bar.children[0])
    }
    else {
        $("#content")[0].appendChild(button)
        $("#content")[0].appendChild(text)
    }
    console.log("[QID] Added inventory dump button.")
}


//========
// request
//========

//gets the quick stock page and uses data from there to process
function requestQuickStock() {
    console.log("[QID] Requesting quickstock page...")
    $("#qid-status")[0].innerHTML = "Counting stock..."

    let totalinv = 0 //# of items before dump
    let currn = 0 //# of items dumped so far

    //sends the first request
    $.get("https://www.neopets.com/quickstock.phtml", function(data, status){
        let doc = new DOMParser().parseFromString(data, "text/html")
        //does nothing if stackpath's a bitch
        if(doc.title != "Neopets - Quickstock") {
            console.log("[QID] Quick Stock page request blocked by stackpath. :(")
            $("#qid-status")[0].style.backgroundColor = "#f2d8d3"
            $("#qid-status")[0].innerHTML = "ERROR: Stackpath Blocked!"
            $("#qid-status")[0].classList.add("done")
            $("#qid-button")[0].classList.add("done")
            return
        }
        let qs = getReqText(doc)
        totalinv = qs[1] //records # of items to deposit total
        //does nothing if nothing to dump
        if(totalinv < 1) {
            console.log("[QID] Your inventory is empty!")
            $("#qid-status")[0].style.backgroundColor = "#d3f5dc"
            $("#qid-status")[0].innerHTML = "0 Items -> SDB"
            $("#qid-status")[0].classList.add("done")
            $("#qid-button")[0].classList.add("done")
            return
        }

        let n = Math.min(70, qs[1]) //# of items getting deposited (max 70 at a time)
        let additional_reqs = Math.floor(totalinv / 70) //finds # of additional requests to make after this first one
        console.log(`[QID] Depositing ${totalinv} items using ${additional_reqs+1} requests.`)
        $("#qid-status")[0].innerHTML = `Status: ${currn} / ${totalinv}`

        //sends request using quickstock process link
        console.log(`[QID] Sending request 1 / ${additional_reqs+1}.`)
        $.post("/process_quickstock.phtml", qs[0], () => {
            console.log(`[QID] ${currn + n} / ${totalinv} items deposited.`)
            currn += n
            $("#qid-status")[0].innerHTML = `Status: ${currn} / ${totalinv}`
            if(additional_reqs > 0) startAdditionalReq(additional_reqs, qs, totalinv, currn, 0) //handles extra requests
        })
    })
}

//since qs has a 70 item limit, sometimes we need to send additional requests one after the other
//this function is recursive and thus pretty jank. please forgive me.
async function startAdditionalReq(additional_reqs, qs, totalinv, currn, i) {
    let promise = new Promise((res) => {
        //if we've done enough requests, stop the loop
        if(i >= additional_reqs) {
            $("#qid-status")[0].innerHTML = `${currn} Items -> SDB`
            $("#qid-status")[0].style.backgroundColor = "#d3f5dc"
            $("#qid-status")[0].classList.add("done")
            $("#qid-button")[0].classList.add("done")
            res(false)
            return
        }
        //perform a dump
        console.log(`[QID] Visiting quickstock ${i+2} / ${additional_reqs+1}.`)
        $.get("https://www.neopets.com/quickstock.phtml", function(data, status){
            let doc = new DOMParser().parseFromString(data, "text/html")
            //stops if stackpath blocked
            if(doc.title != "Neopets - Quickstock") {
                console.log("[QID] Quick Stock page request blocked by stackpath. :(")
                $("#qid-status")[0].style.backgroundColor = "#f2d8d3"
                $("#qid-status")[0].innerHTML = "ERROR: Stackpath Blocked!"
                $("#qid-status")[0].classList.add("done")
                $("#qid-button")[0].classList.add("done")
                return
            }

            qs = getReqText(doc)
            let n = Math.min(70, qs[1]) //# of items getting deposited

            //sends request using quickstock process link
            console.log(`[QID] Sending request ${i+2} / ${additional_reqs+1}.`)
            $.post("/process_quickstock.phtml", qs[0], () => {
                console.log(`[QID] ${currn + n} / ${totalinv} items deposited.`)
                currn += n
                $("#qid-status")[0].innerHTML = `Status: ${currn} / ${totalinv}`
                res(currn < totalinv)
            })
        })
    }).then((val) => { //dump again
        if(val) startAdditionalReq(additional_reqs, qs, totalinv, currn, i+1)
        else {
            $("#qid-status")[0].innerHTML = `${currn} Items -> SDB`
            $("#qid-status")[0].style.backgroundColor = "#d3f5dc"
            $("#qid-status")[0].classList.add("done")
            $("#qid-button")[0].classList.add("done")
        }
    })
}

//formats the data to be sent to the process post request
function getReqText(doc) {
    let items = Array.from(doc.querySelectorAll("form > table > tbody > tr > input"))
        .map((input) => {
            let n = input.getAttribute("name").match(/id_arr\[(\d*)\]/)[1]
            //added an action field in case i decide to expand on this in the future
            return {name:input.getAttribute("name"), value: input.getAttribute("value"), actionkey: `radio_arr[${n}]`, action: "deposit"}
        })
    if(items.length == 0) return [null, 0] //shortcut

    let req = "buyitem=0"
    for(const item of items) {
        //add item to request
        req += `&${item.name}=${item.value}`
        //add action to request
        if(item.action) req += `&${item.actionkey}=${item.action}`
    }
    return [req.replaceAll("[", "%5B").replaceAll("]", "%5D"), items.length]
}


//==========
// css stuff
//==========

function addCSS() {
    //beta and classic need to place the elements differently
    if(isBeta) {
        document.head.appendChild(document.createElement("style")).innerHTML = `
            .invdumpbutton {
                position: relative;
                margin-right: 16px;
                top: 0px;
            }
            .invdumptext {
                top: -7px;
                right: 176px;
                padding-right: 46px !important;
            }
            div.navsub-right__2020 {
                height: 32.422px !important;
            }
            div.navsub-right__2020 > a {
                position: relative;
                top: -8px;
            }
        `
    }
    else {
        document.head.appendChild(document.createElement("style")).innerHTML = `
            .invdumpbutton {
                top: 4px;
                right: 4px;
                position: absolute;
            }
            .invdumptext {
                top: -2px;
                left: calc(100% - 44px);
                padding-left: 46px !important;
            }
            #content {
                position: relative;
            }
        `
    }

    document.head.appendChild(document.createElement("style")).innerHTML = `
        .invdumpbutton {
            display: inline-block;
            width: 32px !important;
            height: 32px !important;
            background-image: url(https://images.neopets.com/themes/h5/altadorcup/images/quickstock-icon.png);
            background-size: 32px 32px;
            cursor: pointer;
            z-index: 2000;
        }
         .invdumpbutton:not(.working):hover {
            animation: shake 0.4s;
        }
        .invdumpbutton:hover + .invdumptext {
            visibility: visible;
            opacity: 1;
        }
        .invdumptext.working.done, .invdumpbutton.working.done {
            opacity: 0 !important;
            visibility: hidden !important;
            transition: opacity 4s ease-out, visibility 4s ease-out;
        }
        .invdumptext.working {
            visibility: visible;
            opacity: 1;
        }
        .invdumptext {
            color: black;
            position: absolute;
            display: block;
            background-color: white;
            border: solid 3px #913A15;
            opacity: 0;
            visibility: hidden;
            transition: visibility 0s, opacity 0.1s linear;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1800;
            width: fit-content;
            white-space: nowrap;
            overflow: hidden;
            font-weight: bold;
            font-size: 12pt;
            font-family: "Cafeteria", 'Arial Bold', sans-serif;
        }
        /*adapted from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_shake*/
        @keyframes shake {
            0% { transform: translate(2%, 2%) rotate(0deg); }
            10% { transform: translate(-2%, -6%) rotate(-5deg); }
            20% { transform: translate(-6%, 0px) rotate(5deg); }
            30% { transform: translate(6%, 2%) rotate(0deg); }
            40% { transform: translate(2%, -2%) rotate(5deg); }
            50% { transform: translate(-2%, 4%) rotate(-5deg); }
            60% { transform: translate(-6%, 2%) rotate(0deg); }
            70% { transform: translate(6%, 2%) rotate(-5deg); }
            80% { transform: translate(-2%, -2%) rotate(5deg); }
            90% { transform: translate(2%, 4%) rotate(0deg); }
            100% { transform: translate(2%, -4%) rotate(-5deg); }
        }
    `
}

