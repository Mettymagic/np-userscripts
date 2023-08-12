// ==UserScript==
// @name         Neopets - Active Pet Switch <MettyNeo>
// @version      1.0
// @description  Adds a button to the sidebar that lets you easily switch your active pet.
// @author       Metamagic
// @match        *://*.neopets.com/*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

//==============
// main function
//==============

const url = document.location.href
let isBeta = false
if($("[class^='nav-pet-menu-icon']").length) isBeta = true


if(url.includes("neopets.com/home")) {
    updatePetInfo()
}

createMenuButton()

//=========
// overhead
//=========

function updatePetInfo() {
    let ref = getUserRef()
    if(ref) GM_setValue("userref", ref)
    let pets = getPets()
    if(pets) GM_setValue("petlist", pets)
    GM_setValue("username", getUsername())
    console.log("[APS] Pet data recorded.")
}

function validateUser() {
    if(getUsername() != GM_getValue("username")) {
        console.log("[APS] New username detected, resetting pet data.")
        GM_deleteValue("userref")
        GM_deleteValue("petlist")
        GM_deleteValue("username")
        return false
    }
    return true
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
        if(!isBeta) {
            link.style.width = "146px"
            link.innerHTML = "Change Active Pet"
        }
        else {
            link.innerHTML = "Change Active Pet"
        }
        link.addEventListener("click", ()=>{openMenu()})
        e.appendChild(link)
        createMenu()
    }
}

function createMenu() {
    if(validateUser()) {
        let menu = document.createElement("div")
        menu.id = "select-active-pet-menu"
        menu.classList.add("activepetmenu")
        menu.style.display = "none"
        if(url.includes("neopets.com/home")) menu.style.paddingTop = "65px"

        let header = document.createElement("div")
        header.classList.add("activetableheader")
        header.style.backgroundColor = getThemeColor()
        header.style.color = getTextColor()
        header.innerHTML = `<b>Select an Active Pet:</b><br><small><small><small>(Click anywhere else to exit)</small></small></small>`

        menu.appendChild(header)
        menu.appendChild(createTable())
        if(isBeta) document.body.insertBefore(menu,$(".hp-bg-grid__2020")[0])
        else $("#main")[0].insertBefore(menu, $("#content")[0])
    }
}

function createTable() {
    let petList = Object.values(GM_getValue("petlist"))
    let table = document.createElement("table")
    let activePet = getActivePet()
    table.classList.add("activetable")

    for (let i = 0; i < 4; i++) { //4 rows
        let row = table.insertRow()
        row.classList.add("activetablerow")
        for(let j = 0; j < 5; j++) { //5 per row
            let index = i*5 + j
            if(index < petList.length) {
                let img = petList[index].img.withBG //300x300
                let name = petList[index].name

                let cell = row.insertCell()
                cell.setAttribute("name", name)
                if(activePet == name) {
                    cell.classList.add("activepetcell")
                    cell.innerHTML = `<img src=${img} width="150" height="150" alt=${name}><br>(already active)`
                }
                else {
                    cell.innerHTML = `<img src=${img} width="150" height="150" alt=${name}><br>${name}`
                    cell.classList.add("activetablecell")
                    cell.addEventListener("click", (event)=>{event.stopPropagation(); changeActivePet(name);})
                    cell.style.cursor = "pointer"
                }
            }
        }
    }
    return table
}


//=====================
//element functionality
//=====================

function openMenu() {
    if(GM_getValue("petlist") && GM_getValue("userref")) {
        $("#select-active-pet-menu")[0].style.display = "flex"
        if(isBeta) {
            $("#container__2020")[0].style.display = "none"
            $("#navprofiledropdown__2020")[0].style.display = "none"
            $("#navdropdownshade__2020")[0].style.display = "none"
            $(".navsub-left__2020")[0].style.display = "none"
            $(".navsub-right__2020")[0].style.display = "none"
        }
        else {
            $("#content")[0].style.display = "none"
        }
        //closes menu if click happens

        setTimeout(()=>{document.body.addEventListener("click", exitClick, false)}, 50)
    }
    else {
        if(window.confirm("ERROR: You have to visit the homepage before you are able to use this script!\n\nVisit the homepage now?")) window.location.href = "https://www.neopets.com/home/"
        console.log("[APS] Data missing, visit https://www.neopets.com/home/ to populate.")
    }
}

function exitClick(event) {
    if(!document.querySelector(".activetable").contains(event.target)) {
        $("#select-active-pet-menu")[0].style.display = "none"
        if(isBeta) {
            $("#container__2020")[0].style.display = "block"
            $(".navsub-left__2020")[0].style.display = "block"
            $(".navsub-right__2020")[0].style.display = "block"
        }
        else {
            $("#content")[0].style.display = "block"
        }
        document.body.removeEventListener("click", exitClick, false)
    }
}

function changeActivePet(name) {
    //hides menu once a selection is made
    $("#select-active-pet-menu")[0].style.display = "none"
    if(isBeta) {
        $("#container__2020")[0].style.display = "block"
        $(".navsub-left__2020")[0].style.display = "block"
        $(".navsub-right__2020")[0].style.display = "block"
    }
    else {
        $("#content")[0].style.display = "block"
    }
    let ref = GM_getValue("userref")
    $.ajax({
        url: "/np-templates/ajax/changepet.php",
        dataType: 'json',
        data: {
            "_ref_ck":ref,
            "new_active_pet":name,
        },
        type: "post",
        success: function(data){
            console.log(`[APS] Active pet changed to ${name}.`)
            window.location.reload()
        }
    });
}


//========
// getters
//========

function getUsername() {
    if(isBeta) return $("#navprofiledropdown__2020 > div:nth-child(3) > a")[0].innerHTML
    else return $("#header > table > tbody > tr:nth-child(1) > td.user.medText > a:nth-child(1)")[0].innerHTML
}

function getUserRef() {
    let src = document.documentElement.outerHTML.split(/[\r\n]+/).find( l => l.includes('"_ref_ck":'))
    return src.split(":")[1].replaceAll(/[^a-zA-Z\d]/g, "").trim()
}

function getPets() {
    let elements = Array.from($(".hp-carousel-pet"))
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
    else return petInfo
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

function getThemeColor() {
    if(isBeta) return $(".nav-profile-dropdown__2020").css("background-color")
    else return $("#content > table > tbody > tr > td.sidebar > div:nth-child(1) > table > tbody > tr:nth-child(1) > td").css("background-color")
}

function getTextColor() {
    if(isBeta) return $(".nav-profile-dropdown-text").css("color")
    else return "black"
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
    document.head.appendChild(document.createElement("style")).innerHTML = `
        .activepetmenu {
            background-color: #8a8a8a;
            width: 100%;
            height: 100%;
            flex-direction: column;
        }
        .openmenubutton {
            color: blue !important;
            background-color: #a3a3a3;
            border: 2px solid #4f4f4f;
            cursor: pointer;
            font-size: 8pt;
            padding: 1px 0px 1px;
            width: 90%;
            height: 100%;
            display: block;
            font-weight: normal;
            text-align: center;
        }
        .activetableheader {
            text-align: center;
            font-size: 16pt;
            cursor: default;
            padding: 4px;
        }
        .activetable {
            display: table;
            margin: 0 8%;
            padding: 20px 20px;
            text-align: center;
            width: auto;
            height: auto;
            background-color: #FFFFFF;
        }
        .activetablerow {
            display: table-row;
            align-items: center;
            justify-content: center;
        }
        .activetablecell {
            display: table-cell;
            padding-top: 6px;
            font-weight: bold;
            text-align: center;
            background-color: #e6e6e6;
        }
        .activetablecell:hover {
            background-color: #c9e3b3;
        }
        .activetablecell:hover img {
            opacity: 0.95;
        }

        .activepetcell {
            padding-top: 6px;
            display: table-cell;
            text-align: center;
            cursor: not-allowed;
            background-color: #8f8f8f;
            color: #4a4a4a;
        }
        .activepetcell img {
            opacity: 0.3;
        }
    `
}