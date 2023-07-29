// ==UserScript==
// @name         Neopets - Battledome Set Selector <MettyNeo>
// @description  Adds a toolbar to define and select up to 5 different loadouts. can default 1 loadout to start as selected. Also adds other QoL battledome features, such as skipping the final battle animation to pull up the victory screen without prompt.
// @author       Metamagic
// @version      1.4
// @match        https://www.neopets.com/dome/arena.phtml
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

const HIGHLIGHT_MAX_REWARDS = true //makes the victory box red tinted if you're maxed on items. set to false to disable
const SKIP_FINAL_ANIMATION = true //skips the final animation, pulling up the victory prompt without having to manually skip the animation. set to false to disable.
const REWARD_POPUP_DELAY = 250 //delay (in ms) to wait before pulling up the victory menu.

//==========
// style css
//==========

//bar
document.head.appendChild(document.createElement("style")).innerHTML = `
    .bdbartext {
        font-family: "Comic Sans MS", "Comic Sans", serif;
        text-align: center;
        text-overflow: hidden;
        overflow: hidden;
        padding: 2px;
        margin: auto;
        max-width: 100%;
        max-height: 100%;
        font-size: 14px;
        line-height: 100%;
        color: inherit;
        cursor: default;
    }

    .bdbarclickable {
        border-style: solid;
        border-width: 1px;
        border-color: #000;
    }

    .bdsetbar {
        height: 80px;
        width: 98%;
        background-color: #CCCCCC;
        margin: auto;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0px 10px;
        position: relative;
    }

    .bdsetcontainer {
        height: 60px;
        padding: 5px;
        width: 18%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .bdsetbutton {
        background-color: #FFFFFF;
        height: 60px;
        width: 100px;
        margin: 2px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        container-type: inline-size;
    }

    .activebutton {
        cursor: pointer !important;
    }
    .activebutton:active {
        background-color: #DEDEDE; /* haha nice */
    }

    .bdsetthumbnail {
        display: inline-flex;
        justify-content: space-evenly;
        align-items: center;
        height: 70%;
        width: 100%;
    }

    .bdseticoncontainer {
        margin: auto;
        padding: 4px;
        height: 100%;
        flex: 1;
        display: flex;
        align-items: center;
    }

    .bdseticon {
        max-width:100%;
        max-height:100%;
        object-fit: cover;
        position: relative;
    }

    .bdsetoptioncontainer {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .bdsetoption {
        background-color: #C2D1D1;
        padding: 2px;
        margin: 1px 0px;
    }
    .activeoption {
        cursor: pointer !important;
    }
    .activeoption:active {
        background-color: #A5B5B5;
    }
`

//settings window
document.head.appendChild(document.createElement("style")).innerHTML = `
    .settingswindow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100;
        background-color: #FFFFFF;
        display: flex;
        flex-direction: column;
        justify-content: flex-start
    }

    .container-vertical {
        display: flex;
        justify-content: flex-start;
        flex-direction: column;
        padding: 10px;
    }

    .container-horizontal {
        display: inline-flex;
        justify-content: space-between;
        margin-bottom: 4px;
    }
`

//==========
// constants
//==========
let firstLoad = true

//button colors in rgb
const red = [180,75,75]
const blue = [107,168,237]
const green = [123,199,88]
const yellow = [249,204,14]
const magenta = [179,89,212]
const gray = [99,99,99]
const colormap = [red,blue,green,magenta,yellow]

const nullset = {set:null, name:null, default:null}
const nullautofill = {turn1:null, turn2:null, default:null}

//const hovermult = 0.875 //becomes darker when hovered over

//=====
// main
//=====

//adds bar once bd intro disappears
//the magic happens from there :)
const introObs = new MutationObserver(mutations => {
    introbreak:
    for(const mutation of mutations) {
        for(const removed of mutation.removedNodes) {
            if(removed.id === "introdiv") {
                addBar() //adds set bar
                handleItemLimit() //checks for when item limit has been reached
                introObs.disconnect() //observation done
                break introbreak
            }
        }
    }
})
introObs.observe($("#arenacontainer #playground")[0], {childList: true})

//================
// create elements
//================

function addBar() {
    let bar = document.createElement("div")
    bar.id = "bdsetbar"
    bar.classList.add("bdsetbar", "bdbartext")
    bar.style.fontSize = "24px"
    bar.innerHTML = "(waiting for battle to start)"

    //place bar above status
    let status = $("#statusmsg")[0]
    status.parentNode.insertBefore(bar, status)

    let autofilled = -1 //prevents autofilling twice in same round
    //checks status bar for when turn is ready
    const statusObs = new MutationObserver(mutations => {
        for(const mutation of mutations) {
            if(status.textContent == "Plan your next move..."){
                //populates the bar
                if(firstLoad) {
                    bar.innerHTML = ""
                    fillBar(bar)
                }
                if(autofilled < getRoundCount()) {
                    autofilled = getRoundCount()
                    setDefault()
                }
                break
            }
        }
    })
    statusObs.observe(status, {childList: true})

    //checks hud for when battle is over
    if(SKIP_FINAL_ANIMATION) {
        let hud = $("#arenacontainer #playground #gQ_scenegraph #hud")[0]
        const hpObs = new MutationObserver(mutations => {
            for(const mutation of mutations) {
                if(hud.children[5].innerHTML <= 0 || hud.children[6].innerHTML <= 0) {
                    pressFinalSkip()
                    hpObs.disconnect()
                    break
                }
            }
        })
        hpObs.observe(hud, {childList: true, subtree: true})
    }
}

//checks to see if bar should be populated before doing that
function fillBar(bar) {
    //script is disabled for obelisk once item limit hit
    if(isObelisk()) {
        let limit = getData("bditemlimit")
        let date = getDate()
        //havent hit item limit yet today, not blocked
        if(limit != date) {
            if(firstLoad) {
                console.log("[BSS] Obelisk battle detected but daily item limit not reached, BSS permitted.")
                console.log("[BSS] Populating BSS bar.")
            }
            else console.log("[BSS] Refreshing BSS bar.")
            populateBar(bar)

        }
        //hit item limit today, blocked
        else {
            console.log("[BSS] Obelisk battle beyond daily limit detected, BSS disabled.")
            bar.innerHTML = "<i>A true warrior enters the battlefield with honor.</i>\n<i><small>The Obelisk rejects those who require assistance in battle. Prove your faction's worth on your own.</small></i>"
        }
        if(firstLoad) addObeliskContribution()
    }
    //script is disabled for 2p
    else if(is2Player()) {
        console.log("[BSS] 2P battle detected, BSS disabled.")
        bar.innerHTML = "<i>A true warrior enters the battlefield with honor.</i><i><small>League regulations require you to be on your own in these battles. May fate be by your side.</small></i>"
    }
    else {
        if(firstLoad) console.log("[BSS] Populating BSS bar.")
        else console.log("[BSS] Refreshing BSS bar.")
        populateBar(bar)
    }
    firstLoad = false
}

function populateBar(bar) {
    //puts each sets container on the bar
    let bdsetdata = getData("bdsets")
    bdsetdata.forEach((set, index) => {
        //main container of a set
        let container = document.createElement("div"), options = document.createElement("div")
        //sets element classes
        container.classList.add("bdsetcontainer", "bdbartext")
        container.id = `bdsetc${index}`
        container.style.backgroundColor = getHex(colormap[index])

        let button = makeSetButton(set.name, set.set, index)
        container.appendChild(button)

        //adds option buttons to container
        options.classList.add("bdsetoptioncontainer")
        container.appendChild(options)
        let save = makeSaveButton(index)
        let opt = makeSettingsButton(index)
        //adds label to container
        let defc = document.createElement("div")
        defc.style.textAlign = "right"
        defc.style.marginTop = "2px"
        switch(set.default) {
            case "1":
                defc.innerHTML = "<b>T1</b>"
                break
            case "2":
                defc.innerHTML = "<b>T2</b>"
                break
            case "3":
                defc.innerHTML = "<b>Default</b>"
                break
        }

        options.appendChild(save)
        options.appendChild(opt)
        options.appendChild(defc)

        //adds container to bar
        bar.appendChild(container)
    })

}

//main button to select set
function makeSetButton(name, itemurls, i) {
    //null name means empty set

    //button
    let button = document.createElement("div")
    button.classList.add("bdsetbutton", "bdbarclickable", "setbutton")
    if(name != null) button.classList.add("activebutton")
    else {
        button.style.color = "#949494"
        button.style.backgroundColor = "#DEDEDE"
    }
    if(itemurls != null) {
        button.setAttribute("item1", itemurls[0])
        button.setAttribute("item2", itemurls[1])
        button.setAttribute("ability", itemurls[2])
        button.addEventListener("click", function(){useSet(itemurls[0], itemurls[1], itemurls[2], i)})
    }

    //icons on top of button
    let icons = document.createElement("div")
    icons.classList.add("bdsetthumbnail")
    if(itemurls != null) {
        itemurls.forEach(url => {
            let iconc = document.createElement("div")
            iconc.classList.add("bdseticoncontainer")
            if(url != null) iconc.innerHTML = `<img src='${url}' class='bdseticon'>`
            icons.appendChild(iconc)
        })
    }
    button.appendChild(icons)

    //title on bottom of button
    let text = document.createElement("div")
    text.classList.add("bdbartext")
    if(name == null) {
        text.innerHTML = "(empty set)"
    }
    else text.innerHTML = name
    button.appendChild(text)

    return button
}

//button to save set
function makeSaveButton(i) {
    let button = document.createElement("div")
    button.classList.add("bdsetoption", "bdbarclickable", "bdbartext", "activeoption")
    button.index = i
    button.innerHTML = "Save Set"
    button.addEventListener("click", function(){saveNewSet(i)})
    return button
}

//button to set autofill options
function makeSettingsButton(i) {
    let button = document.createElement("div")
    button.classList.add("bdsetoption", "bdbarclickable", "bdbartext")
    if(getData("bdsets", i).name != null) {
        button.classList.add("activeoption")
        button.addEventListener("click", function(){makeSettingsMenu(i)})
    }
    else {
        button.style.color = "#4C5252"
        button.style.backgroundColor = "#A5B5B5"
    }
    button.index = i
    button.innerHTML = "Options"
    return button
}

//one hell of a functiont hat uses JS to make the setting menu
function makeSettingsMenu(i) {
    closeSettingsMenus() //closes other menus

    let set = getData("bdsets", i)
    let isEmptySet = JSON.stringify(set) == JSON.stringify(nullset)

    //menu box
    let menuc = document.createElement("div")
    menuc.id = "bdsettingsmenu"
    menuc.classList.add("settingswindow")
    menuc.setAttribute("index", i)
    let header = document.createElement("div")
    header.style.display = "flex"
    header.style.justifyContent = "space-between"
    header.style.cursor = "pointer"
    header.style.backgroundColor = getHex(colormap[i])
    header.innerHTML = `<b>Set ${i+1} Options</b>`
    header.style.padding = "4px"
    let x = document.createElement("a")
    x.innerHTML = "<b>x</b>"
    x.style.marginRight = "4px"
    x.addEventListener("click", function(){closeSettingsMenus(false, i)})
    header.append(x)
    let container = document.createElement("div")
    container.classList.add("container-vertical")
    menuc.appendChild(header)
    menuc.appendChild(container)

    //change name
    let namec = document.createElement("div")
    namec.classList.add("container-horizontal")
    let nametext = document.createElement("div")
    nametext.innerHTML = "Name:"
    let namebox = document.createElement("INPUT")
    namebox.id = "setname"
    namebox.type = "text"
    namebox.style.width = "65%"
    if(set.name == null) namebox.value = "(empty set)"
    else namebox.value = set.name
    //adjusts name length to fit
    namebox.addEventListener("focus", function(){namebox.setAttribute("old", namebox.value)})
    namebox.addEventListener("blur", function(){
        namebox.value = namebox.value.substring(0, 12);
        if(namebox.value.length < 3) {
            window.alert("ERROR: The name is too short! (3-12 characters)")
            namebox.value = namebox.getAttribute("old")
        }
    })
    if(isEmptySet) namebox.disabled = true
    namec.appendChild(nametext)
    namec.appendChild(namebox)
    container.appendChild(namec)

    //change autofill settings
    let defc = document.createElement("div")
    defc.classList.add("container-horizontal")
    let deftext = document.createElement("div")
    deftext.innerHTML = "Autofill:"
    let defselect = createSelect(i, set)
    if(isEmptySet) defselect.disabled = true
    defc.appendChild(deftext)
    defc.appendChild(defselect)
    container.appendChild(defc)

    //delete
    let del = document.createElement("BUTTON")
    del.innerHTML = "Delete Set"
    del.style.marginRight = "0"
    del.style.marginLeft = "auto"
    del.style.width = "120px"
    //disabled if empty set
    if(isEmptySet) del.disabled = true
    else {
        del.addEventListener("click", function(){
            if(deleteSet(i)) {
                closeSettingsMenus(false, i)
                window.alert(`Set ${i+1} successfully deleted.`)
            }
        })
    }
    container.appendChild(del)

    let div = document.createElement("div")
    div.style.height = "12px"
    container.appendChild(div)

    //close menu
    let close = document.createElement("BUTTON")
    close.innerHTML = "Save Changes"
    close.addEventListener("click", function(){closeSettingsMenus(true, i)})
    container.appendChild(close)

    $("#arenacontainer")[0].parentElement.appendChild(menuc)
}

//saves and closes the setting menu
function closeSettingsMenus(save, i) {
    let menu = $("#bdsettingsmenu")[0]
    if(menu == undefined) return
    //save changes
    if(save) {
        //check for differences
        let oldset = getData("bdsets", i)
        let name = $("#bdsettingsmenu #setname")[0].value
        let autofill = $("#bdsettingsmenu #setautofill")[0].value
        //if no differences, do nothing
        if(name == oldset.name && autofill == oldset.default)
            window.alert("No changes were saved.")
        //if differences, update the set
        else {
            oldset.name = name
            oldset.default = autofill
            updateStoredSet(i, oldset, oldset.default == autofill)
        }
    }
    //remove setting menu
    menu.innerHTML = ""
    menu.remove()
}

function createSelect(i, set) {
    let afset = getData("bdautofill")

    let defselect = document.createElement("SELECT")
    defselect.id = "setautofill"
    //options
    let o1=document.createElement("OPTION"), o2=document.createElement("OPTION"), o3=document.createElement("OPTION"), o4=document.createElement("OPTION")
    o1.value = null
    o1.label = "Never"
    o1.innerHTML = "Never" //for some reason label doesnt work on some systems
    o2.value = 1
    o2.label = "First Turn"
    o1.innerHTML = "First Turn"
    if(afset.turn1 != null && afset.turn1 != i) o2.disabled = true
    o3.value = 2
    o3.label = "Second Turn"
    o1.innerHTML = "Second Turn"
    if(afset.turn2 != null && afset.turn2 != i) o3.disabled = true
    o4.value = 3
    o4.label = "Default"
    o1.innerHTML = "Default"
    if(afset.default != null && afset.default != i) o4.disabled = true

    //adds options
    defselect.appendChild(o1)
    defselect.appendChild(o2)
    defselect.appendChild(o3)
    defselect.appendChild(o4)

    //sets default value
    defselect.value = set.default

    return defselect
}

//=====================
// button functionality
//=====================

//selects items from saved set
function useSet(item1, item2, ability, i) {
    //clears slots before selecting
    clearSlots()
    let error = false //doesnt check rest of slots if error encountered

    //item 1
    if(item1 != null) error = selectSlot($("#arenacontainer #p1e1m")[0], item1)
    //item 2
    if(item2 != null && !error) {
        //selects second available if 2 of same item chosen
        if(item1 == item2) error = selectSlot($("#arenacontainer #p1e2m")[0], item2, 2)
        else error = selectSlot($("#arenacontainer #p1e2m")[0], item2)
    }
    //ability
    if(ability != null && !error) selectSlot($("#arenacontainer #p1am")[0], ability)

    //makes fight button active
    $("#arenacontainer #fight")[0].classList.remove("inactive")
    $("#arenacontainer #fight")[0].classList.add("caction")

    console.log(`[BSS] Set ${i} applied.`)
}

//save current selection to set
function saveNewSet(i) {
    let oldset = getData("bdsets", i)
    let newset = getCurrentItems()

    //if the new set is empty
    if(JSON.stringify(newset) == JSON.stringify([null,null,null])) {
        window.alert("ERROR: You cannot save an empty set!")
        return
    }
    //if there are no changes
    else if(JSON.stringify(oldset.set) == JSON.stringify(newset)) {
        window.alert("ERROR: There are no changes to save!")
        return
    }
    else if(JSON.stringify(oldset) != JSON.stringify(nullset)){
        if(!window.confirm("WARNING: Are you sure you wish to update your previous set?")) return
    }

    //creates new set object
    let bdset = {set:newset, name:oldset.name, default:oldset.default}

    //choose a name if no name
    if(oldset.name == null) {
        let n = prompt("Enter a name for the set:", `Weapon Set ${i+1}`)
        if(n == null) return
        while(n.length < 3 || n.length > 12) {
            n = prompt("ERROR: Name must be between 3-12 chars!\nEnter a name for the set:", `Weapon Set ${i+1}`)
        }
        bdset.name = n
    }

    updateStoredSet(i, bdset)
    console.log(`[BSS] Set slot ${i} saved.`)
    updateBar()
}

function clearSlots() {
    let e1 = $("#arenacontainer #p1e1m")[0]
    e1.children[1].style.opacity = "1"
    if(e1.classList.contains("selected")) e1.click()
    let e2 = $("#arenacontainer #p1e2m")[0]
    if(e2.classList.contains("selected")) e2.click()
    e2.children[1].style.opacity = "1"
    let a = $("#arenacontainer #p1am")[0]
    a.children[1].style.opacity = "1"
    if(a.classList.contains("selected")) {
        a.click()
        $("#arenacontainer #p1ability")[0].style.display = "none"
    }
}

//=================
// helper functions
//=================

async function pressFinalSkip() {
    delay(REWARD_POPUP_DELAY).then(() => {
        let button = $("#arenacontainer #skipreplay")[0]
        console.log("[BSS] Skipping final animation")
        if(button.classList.contains("replay"))
        {
            button.click()
            delay(100).then(() => {button.click()})
        }
        else button.click()
    })
}

//selects the default set
function setDefault() {
    let round = getRoundCount()
    let autofill = getData("bdautofill")
    console.log(autofill)
    console.log(round)

    if(round == 1 && autofill.turn1 != null) {
        let set = getData("bdsets", autofill.turn1).set
        useSet(set[0],set[1],set[2], autofill.turn1)
        console.log(`[BSS] Set ${autofill.turn1} autofilled.`)
    }
    else if(round == 2 && autofill.turn2 != null) {
        let set = getData("bdsets", autofill.turn2).set
        useSet(set[0],set[1],set[2], autofill.turn2)
        console.log(`[BSS] Set ${autofill.turn2} autofilled.`)
    }
    else if(autofill.default != null){
        let set = getData("bdsets", autofill.default).set
        useSet(set[0],set[1],set[2], autofill.default)
        console.log(`[BSS] Set ${autofill.default} autofilled.`)
    }
}

//gets the selection id from an item's image url
//selects the nth occurrence of the item (defaults to first)
function getItemInfo(url, n=1) {
    let info = null
    let itemlist = $("#arenacontainer #p1equipment")[0].children[2].getElementsByTagName("li")
    let count = 0
    //iterates through each item in bd menu (even if its hidden it still exists)
    for(const item of itemlist) { //each column
        if(item.children[0].src == url) {
            count++
            if(count == n) {
                info = {id:item.children[0].id, name:item.children[0].alt, node:item.children[0]}
                break
            }
        }
    }
    return info
}

//for some reason ability list is a table whereas item lists arent??
function getAbilityInfo(url) {
    let info = null
    let table = $("#arenacontainer #p1ability")[0].children[2].children[0].getElementsByTagName("td")

    for(const node of table) {
        if(node.getAttribute("title") != null) {
            //we found our node
            let nodeurl = node.children[0].innerHTML.match(/img src=\"(.*?)\"/)[1]
            //sometimes image links dont include 'https:' for some reason
            if(!nodeurl.includes("https:")) {
                nodeurl = "https:"+nodeurl
            }
            if(nodeurl == url) {
                //ability on cd
                if(node.children[0].classList.contains("cooldown")) info = -1
                else info = {id: node.children[0].getAttribute("data-ability"), name: node.title, node:node}
                break
            }
        }
    }

    return info
}

//sets a bd item to a saved slot's item
function selectSlot(slot, item, n=1) {
    let isAbility = slot.id == "p1am"
    let info = null
    if(isAbility)
        info = getAbilityInfo(item, n)
    else
        info = getItemInfo(item, n)
    if(info == -1 && isAbility) {
        window.alert("WARNING: The selected ability is on cooldown and has not been selected!")
        return true
    }
    if(info == null) {
        window.alert(`ERROR: Tried to assign item not equipped to pet!\nURL of missing item: ${item}`)
        return true
    }
    let slotid = slot.id.slice(0, -1)
    $(`#arenacontainer #${slotid}`)[0].value = info.id

    //updates slot icon
    slot.classList.add("selected")
    slot.children[1].style.backgroundPosition = "0px 0px"
    slot.children[1].style.backgroundSize = "60px 60px"
    slot.children[1].style.backgroundImage = `url("${item}")`
    if(!isAbility)
        slot.addEventListener("click", function(){ info.node.removeAttribute("style") })

    //removes item from equipment menu
    if(!isAbility)
        info.node.style.display = "none"

    return false
}


//remove and re-adds bar to update visuals
function updateBar() {
    let bar = $("#bdsetbar")[0]
    bar.innerHTML = ""
    fillBar(bar)
}

//returns array of currently selected stuff from arena
function getCurrentItems() {
    return [getItemURL($("#arenacontainer #p1e1m")[0]),
    getItemURL($("#arenacontainer #p1e2m")[0]),
    getItemURL($("#arenacontainer #p1am")[0], true)]
}

//===============
// data functions
//===============

//'deletes' a set by making it nullset
function deleteSet(i) {
    let select = window.confirm("WARNING: Are you sure you want to delete this set?")
    if(select) {
        let sets = getData("bdsets")
        sets[i] = nullset
        setData("bdsets")
        updateBar()
        console.log(`[BSS] Set ${i} deleted.`)
    }
    return select
}

//updates set at index i
function updateStoredSet(i, newset, updateAutofill=-1) {
    //updates stored set
    let sets = getData("bdsets")
    sets[i] = newset
    setData("bdsets", sets)
    //updates autofill
    if(updateAutofill != -1) {
        let autofill = getData("bdautofill")
        //remove index from autofill
        if(autofill.turn1 == i) autofill.turn1 = null
        else if (autofill.turn2 == i) autofill.turn2 = null
        else if (autofill.default == i) autofill.default = null
        //add to autofill
        switch(newset.default) {
            case "1":
                autofill.turn1 = i
                break;
            case "2":
                autofill.turn2 = i
                break;
            case "3":
                autofill.default = i
                break;
        }
        //saves new autofill
        setData("bdautofill", autofill)
    }
    updateBar()
}

//keeps support from cookies
function getData(tag, i = null) {
    if(tag == "bdsets") {
        let ns = clone([nullset,nullset,nullset,nullset,nullset])

        //still supports browser cookies to prevent set wipes
        let cookie = window.localStorage.getItem("bdsets")
        if(cookie != null) {
            if(i != null) return JSON.parse(JSON.parse(cookie)[i])
            else {
                let arr = JSON.parse(cookie)
                for(i = 0; i < 5; i++) {
                    arr[i] = JSON.parse(arr[i])
                }
                return arr
            }
        }
        else {
            if(i != null) return GM_getValue("bdsets", ns)[i]
            else return GM_getValue("bdsets", ns)
        }
    }
    else if(tag == "bdautofill") {
        //still supports browser cookies to prevent set wipes
        let cookie = window.localStorage.getItem("bdautofill")
        if(cookie != null) return JSON.parse(cookie)
        else return GM_getValue("bdautofill", clone(nullautofill))
    }
    else {
        return GM_getValue(tag, null)
    }
}

//clears cookies if they exist to convert over to script storage
function setData(tag, value) {
    window.localStorage.removeItem(tag)
    GM_setValue(tag, value)
}

//================
// misc. functions
//================

//used for autofill
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
function getRoundCount() {
    return $("#logheader #flround")[0].innerHTML
}

//used for legitimacy checks to disable in areas that give advantage
const obelisktags = [
    "_order",
    "_thief",
    "_awakened",
    "_seekers",
    "_brute",
    "_sway"
]
const guildmap = {
    "_order": "Order",
    "_thief": "Thieves",
    "_awakened": "Awakened",
    "_seekers": "Seekers",
    "_brute": "Brutes",
    "_sway": "Sway"
}
const guildNameMap = []
function isObelisk() {
    let p2 = $("#arenacontainer #playground #gQ_scenegraph #p2 #p2image")[0]
    let url = p2.style.backgroundImage
    let res = null
    for(const tag of obelisktags){
        if(url.includes(tag)) {
            res = guildmap[tag]
            break
        }
    }
    return res
}
//checks if item limit has been reached today and stores data if so
function handleItemLimit() {
    let limit = getData("bditemlimit")
    let date = getDate()

    //if we haven't hit item limit yet, observe for it
    if(limit != date) {
        console.log("[BSS] Enabled scanning for item limit.")
        let loot = $("#arenacontainer #bdPopupGeneric-winnar #bd_rewardsloot")[0]
        const lootObs = new MutationObserver(mutations => {
            for(const mutation of mutations) {
                if(hitItemLimit()) {
                    setData("bditemlimit", date)
                    highlightItemLimit()
                    console.log("[BSS] Item limit reached and recorded.")
                    lootObs.disconnect()
                    break
                }
            }
        })
        lootObs.observe(loot, {childList: true, subtree: true})
    }
    //otherwise deal with item limit stuff
    else {
        console.log("[BSS] Item limit previously reached.")
        highlightItemLimit()
    }
}
function hitItemLimit() {
    return $("#arenacontainer #bdPopupGeneric-winnar #bd_rewardsloot")[0].innerHTML
        .includes(`* You have reached the item limit for today! You can continue to fight, but no more items can be earned.`)
}
function highlightItemLimit() {
    //doesnt highlight in obelisk fights
    if(HIGHLIGHT_MAX_REWARDS && !isObelisk()) {
        let win = $("#arenacontainer #bdPopupGeneric-winnar")[0]
        let msg = document.createElement("div")
        win.style.backgroundColor = "#D0EDCA"
        msg.innerHTML = "<b>You have reached the maximum item limit!</b>"
        win.querySelector("#bd_rewards").appendChild(msg)
    }
}
function addObeliskContribution() {
    let obelisk = isObelisk()
    if(isObelisk != null) {
        let win = $("#arenacontainer #bdPopupGeneric-winnar")[0]
        let msg = document.createElement("div")
        if(obelisk.slice(-1) == 's') var plural = "have"
        else plural = "has"
        msg.innerHTML = `<b>Your contributions against The ${obelisk} ${plural} been recorded.</b>`
        win.querySelector("#bd_rewards").appendChild(msg)
    }
}
function is2Player() {
    let p2 = $("#arenacontainer #playground #gQ_scenegraph #p2 #p2image")[0]
    if(p2.style.backgroundImage.includes("pets.neopets.com")) return true
    else return false
}

//helpers
function clone(data) {
    return JSON.parse(JSON.stringify(data))
}

function getDate() {
    return new Date().toLocaleString("en-US", {timeZone: "PST"}).slice(0, 10).replace(",","")
}

function getItemURL(node, ability=false) {
    //for some reason the abilitys class isnt changed to selected
    if(!node.classList.contains("selected") && ability == false) return null
    else {
        let str = node.children[1].style.backgroundImage
        if(str.length < 1) return null
        else {
            let s = str.slice(5, -2)
            if(!s.includes("https:")) s = "https:"+s
            return s
        }
    }
}
function getHex(color) {
    let hex = "#"
    color.forEach(c => {
        hex += c.toString(16).padStart(2, "0")
    })
    return hex
}
