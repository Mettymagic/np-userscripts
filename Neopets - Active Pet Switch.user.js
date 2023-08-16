// ==UserScript==
// @name         Neopets - Active Pet Switch <MettyNeo>
// @version      1.2
// @description  Adds a button to the sidebar that lets you easily switch your active pet.
// @author       Metamagic
// @match        *://*.neopets.com/*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

//collected page data times out after this many hours (default: 1 day)
const HOME_DATA_TIMEOUT = 24

//==============
// main function
//==============

const url = document.location.href
let isBeta = false
if($("[class^='nav-pet-menu-icon']").length) isBeta = true


if(url.includes("neopets.com/home")) {
    getPetData(document) //always update the data while we're here
}

createMenuButton()

//=========
// overhead
//=========

function requestHomePage() {
    GM_setValue("waitfordata", true)
    $.get("https://www.neopets.com/home/", function(data, status){
        let doc = new DOMParser().parseFromString(data, "text/html")
        getPetData(doc)
        console.log("[APS] Data successfully retrieved.")
        GM_setValue("waitfordata", false)
    })
}

function checkForUpdate() {
    //revalidates data if it times out or if username changes
    if(new Date().valueOf() - GM_getValue("lastupdate", 0) > 1000*60*60*HOME_DATA_TIMEOUT) console.log("[APS] Updating data for new day.")
    else if(getUsername() != GM_getValue("un")) console.log("[APS] Updating data for new user.")
    else if(!GM_getValue("petlist", false)) console.log("[APS] Getting user pet data for first time.")
    else return false
    return true
}

function getPetData(doc) {
    GM_setValue("petlist", getPets(doc))
    GM_setValue("lastupdate", new Date().valueOf())
    GM_setValue("un", getUsername())

    console.log("[APS] Pet data updated.")
}

//=================
// element creation
//=================

function createMenuButton() {
    let e = getButtonLocation()
    if(e) {
        addCSS()
        let link = document.createElement("a")
        link.href = "#"
        link.classList.add("openmenubutton")
        link.innerHTML = "Change Active Pet"
        link.addEventListener("click", ()=>{openMenu()})
        e.appendChild(link)
        createMenu() //only adds menu to pages with buttons
    }
}

function createMenu() {
    let menu = document.createElement("div")
    menu.id = "select-active-pet-menu"
    menu.style.display = "none" //starts not visible

    let header = document.createElement("div")
    header.classList.add("activetableheader")
    header.innerHTML = `<b>Select an Active Pet:</b><br><small><small><small>(Click anywhere else to exit)</small></small></small>`
    menu.appendChild(header)

    //table
    let table = document.createElement("table")
    table.classList.add("activetable")
    menu.appendChild(table)
    document.body.appendChild(menu)

    //revalidates if it needs to
    if(checkForUpdate()) {
        let load = document.createElement("div")
        load.innerHTML = "( Fetching pet data ... )"
        menu.appendChild(load)
        GM_addValueChangeListener("waitfordata", function() {
            populateTable()
            menu.removeChild(load)
        })
        requestHomePage()
    }
    //otherwise populates immediately
    else populateTable()
}

function populateTable() {
    let petList = Object.values(GM_getValue("petlist", {}))
    let table = $(".activetable")[0]
    table.innerHTML = ""
    let activePet = getActivePet()

    for (let i = 0; i < 4; i++) { //4 rows
        let row = table.insertRow()
        for(let j = 0; j < 5; j++) { //5 per row
            let index = i*5 + j
            if(index < petList.length) {
                let img = petList[index].img.withBG //300x300
                let name = petList[index].name

                let cell = row.insertCell()
                cell.setAttribute("name", name)
                //name = "test"
                let d1 = document.createElement("div"), d2 = document.createElement("div")
                d1.innerHTML = `<img src=${img} width="150" height="150" alt=${name}>`
                d1.style.width = "150px !important";
                d1.style.height = "150px !important";
                d2.innerHTML = name
                cell.appendChild(d1)
                cell.appendChild(d2)
                if(activePet == name) cell.setAttribute("active", "")
                else {
                    cell.addEventListener("click", (event)=>{event.stopPropagation(); changeActivePet(name);})
                    cell.style.cursor = "pointer"
                }
            }
        }
    }
    console.log(`[APS] Table populated with ${petList.length} pets.`)
}

//=====================
//element functionality
//=====================

function openMenu() {
    $("#select-active-pet-menu").css("display","flex") //makes menu visible
    setTimeout(()=>{document.body.addEventListener("click", exitClick, false)}, 50) //adds the exit click a short delay after menu is created
}

function exitClick(event) {
    event.stopPropagation()
    if(!(document.querySelector(".activetableheader").contains(event.target) || document.querySelector(".activetable").contains(event.target))) {
        $("#select-active-pet-menu")[0].style.display = "none"
        document.body.removeEventListener("click", exitClick, false)
    }
}

function changeActivePet(name) {
    //waits for data if the flag is on
    if(GM_getValue("waitfordata", false)) {
        console.log("[APS] Waiting for data to finish updating...")
        GM_addValueChangeListener("waitfordata", function(key,oldValue,newValue,remote) {
            sendActivePetReq(name)
        })
    }
    //otherwise do it now
    else {
        sendActivePetReq(name)
    }
}

function sendActivePetReq(name) {
    $("#select-active-pet-menu")[0].style.display = "none"
     $.get("/process_changepet.phtml?new_active_pet="+name, function(){
        console.log(`[APS] Active pet changed to ${name}.`)
        window.location.reload()
    })
}


//========
// getters
//========

function getUsername() {
    if(isBeta) return $("#navprofiledropdown__2020 > div:nth-child(3) a.text-muted")[0].innerHTML
    else return $("#header > table > tbody > tr:nth-child(1) > td.user.medText a[href]")[0].innerHTML
}

function getPets(doc) {
    let elements = Array.from(doc.querySelectorAll(".hp-carousel-pet"))
    let petNames = elements.map(e => e.getAttribute("data-name"))
    petNames = petNames.filter((n, index) => petNames.indexOf(n) == index)
    let petInfo = {}
    for(const name of petNames) {
        let e = elements.find(e => e.getAttribute("data-name") == name)
        let img = {noBG: e.style.backgroundImage.replace('"', "").slice(5, -2), withBG: e.getAttribute("data-petimage")}
        let species = e.getAttribute("data-species")
        let color = e.getAttribute("data-color")
        let gender = e.getAttribute("data-gender")
        let hp = `${e.getAttribute("data-health")}/${e.getAttribute("data-maxhealth")}`
        let level = e.getAttribute("data-level")
        let hunger = e.getAttribute("data-hunger")
        let mood = e.getAttribute("data-mood")
        let p2 = getPetpet(e)
        petInfo[name] = {name:name, species:species, color:color, img:img, gender:gender, hp:hp, level:level, hunger:hunger, mood:mood, p2:p2}
    }
    if(petInfo == {}) return null
    //pet list should be in alphabetical order
    let sorted = Object.keys(petInfo).sort().reduce((obj, key) => {
        obj[key] = petInfo[key]
        return obj
    }, {})
    return sorted
}

function getPetpet(e) {
    let petpet = null
    if(e.hasAttribute("data-petpet")) {
        let p = e.getAttribute("data-petpet").split(" ") //no, name, the, fir
        let i = p.lastIndexOf("the") //no petpets have "the" in their name as its own word so this works
        let name = p.slice(0, p.lastIndexOf("the")).join(" ")
        let species = p.slice(p.lastIndexOf("the")+1, p.length).join(" ")
        let img = e.getAttribute("data-petpetimg")
        let p3 = null
        if(e.hasAttribute("data-p3")) p3 = {name:e.getAttribute("data-p3"), img:e.getAttribute("data-p3img")}
        petpet = {name:name, species:species, img:img, p3:p3}
    }
    return petpet
}

function getActivePet() {
    if(isBeta) return $("#navprofiledropdown__2020 > div:nth-child(4) > a")[0].innerHTML
    else return $("#content > table > tbody > tr > td.sidebar > div:nth-child(1) > table > tbody > tr:nth-child(1) > td > a > b")[0].innerHTML
}

function getButtonLocation() {
    if(isBeta) var e = $("#navprofiledropdown__2020 > div:nth-child(4)")
    else e = $(".activePet")
    if(e.length) return e[0]
    else return null
}


//========
// css
//========

function addCSS() {
    if(isBeta) {
        var theme = $(".nav-profile-dropdown__2020").css("background-color")
        var button = $(".nav-profile-dropdown-text").css("color")
        var text = $(".nav-profile-dropdown-text a.text-muted").css("color")
    }
    else {
        theme = $("#content > table > tbody > tr > td.sidebar > div:nth-child(1) > table > tbody > tr:nth-child(1) > td").css("background-color")
        button = "gray";
        text = "black";
    }

    if(isBeta) {
        document.head.appendChild(document.createElement("style")).innerHTML = `
        .openmenubutton {
            border: 2px solid ${text};
            color: ${text} !important;
            background-color: ${button};
            cursor: pointer;
            font-size: 11pt;
            padding: 1px 0px 1px;
            width: 90%;
            height: 100%;
            display: block;
            font-weight: normal;
            text-align: center;
            transition-duration: 0.3s;
            border-radius: 4px;
            box-shadow: 0 5px rgba(0,0,0,0.5);
        }
        .openmenubutton:hover {
            border: 2px solid ${text.slice(0,-1)+", 0.85)"};
            color: ${text.slice(0,-1)+", 0.85)"} !important;
            background-color: ${button.slice(0,-1)+", 0.7)"};
        }
        .openmenubutton:active {
            border: 2px solid ${theme};
            background-color: ${button.slice(0,-1)+", 0.5)"};
            box-shadow: 0 2px rgba(0,0,0,0.5);
            transform: translateY(2px);
        }
        `
    }
    else {
        document.head.appendChild(document.createElement("style")).innerHTML = `
        .openmenubutton {
            margin-top: 3px;
            border: 1px solid black;
            background-color: #D3D3D3;
            cursor: pointer;
            font-size: 8pt;
            padding: 1px 0px 1px;
            width: 148px;
            height: 100%;
            display: block;
            font-weight: normal;
            text-align: center;
        }
        .openmenubutton:hover {
            background-color: #C0C0C0;
        }
        .openmenubutton:active {
            background-color: #808080;
        }
        `
    }

    document.head.appendChild(document.createElement("style")).innerHTML = `
        #select-active-pet-menu {
            position: fixed;
            z-index: 100000;
            background-color: #8a8a8a;
            flex-direction: column;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
        #select-active-pet-menu::before {
            width: 100vw;
            height: 100vh;
            opacity: 0.7;
            background-color: black;
            z-index: -1;
            content: "";
            position: fixed;
            transform: translate(-50%, -50%);
            left: 50%;
            top: 50%;
        }
        .activetableheader {
            text-align: center;
            font-size: 16pt;
            cursor: default;
            background-color: ${theme};
            color: ${text};
            padding-top: 8px;
            padding-bottom: 8px;
            -webkit-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        .activetable {
            padding: 20px 20px;
            text-align: center;
            background-color: #FFFFFF;
            border-spacing: 5px;
        }
        .activetable td {
            font-weight: bold;
            text-align: center;
            background-color: #e6e6e6;
            border-radius: 8px;
            padding-top: 10px;
            padding-bottom: 5px;
            position: relative;
        }
        .activetable td img {
            margin: 0;
            padding: 0;
            width: 150px !important;
            pointer-events: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        .activetable td div {
            margin: 0;
            padding: 0;
            width: 170px !important;
            -webkit-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        .activetable td:hover {
            background-color: #c9e3b3;
        }
        .activetable td:active {
            background-color: #a2cf7c;
        }
        .activetable td:hover img {
            opacity: 0.85;
        }

        .activetable td[active] {
            cursor: not-allowed;
            background-color: #8f8f8f;
            color: #4a4a4a;
        }
        .activetable td[active]::after {
            opacity: 0.6;
            font-size: 16pt;
            text-align: center;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            cursor: not-allowed;
            color: black;
            content: "(already active)";
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            transform: rotate(25deg)
        }
        .activetable td[active] img {
            opacity: 0.3;
        }
    `
}