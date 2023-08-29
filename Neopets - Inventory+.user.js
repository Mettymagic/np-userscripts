// ==UserScript==
// @name         Neopets - Inventory Plus <MettyNeo>
// @version      1.1
// @description  Improves the Inventory page by allowing multiple actions to be performed without a page refresh and saves selected options for items.
// @author       Metamagic
// @match        *://*.neopets.com/inventory.phtml*
// @match        *://neopets.com/inventory.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Inventory%2B.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Inventory%2B.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

// Trans rights are human rights ^^
// metty says hi

//================
// script settings
//================

(function($) {

    //lets you bypass the refresh by clicking outside the box
    const DISABLE_REFRESH = true
    //updates inventory contents when actions are performed
    const UPDATE_ON_ACTION = true
    //remembers the last selected option for each item
    const REMEMBER_SELECTION = true
    //defaults to unstacked view. for fans of the old neopets layout. ^^
    const UNSTACK_VIEW_DEFAULT = false


    //============
    // main script
    //============


    $("#container__2020 > div.page-title__2020 > div.inv-title-container > h1")[0].innerHTML += "+"
    if(DISABLE_REFRESH) $("#refreshshade__2020")[0].remove()
    if(UNSTACK_VIEW_DEFAULT) setStackView("unstack")


    //watches for item description popup
    const descObs = new MutationObserver((mutations) => {
        if(REMEMBER_SELECTION) {
            if($("#iteminfo_select_action").find("option:selected").val() == "Choose an Action") setRememberedSelection()
            rememberSelections()
        }
    })
    descObs.observe(document.getElementById("invDesc"), {childList: true, subtree: true})


    //NOTE: script may not be compatible with certain selection-based capsules (eg essentials) - i don't have the nc to test this unfort
    //watches for item results popup
    let prevDisplay = 'none'
    const resultObs = new MutationObserver((mutations) => {
        //if not loading
        if($("#invResult div.inv-loading-static").length == 0) {
            //special case for gift box menu
            if($("#invResult div.giftgram-img").length > 0 && $("#invResult").css('display') == 'block') {
                //gift sent, refresh page
                console.log($("#invResult > div.popup-body__2020 > p")?.[0])
                if($("#invResult > div.popup-body__2020 > p")?.[0]?.innerHTML?.includes("Your gift has been delivered to")) {
                    if(UPDATE_ON_ACTION) refreshInventory()
                    if(DISABLE_REFRESH) disableRefresh()
                }
                else if(DISABLE_REFRESH) disableRefresh(false)
                prevDisplay = 'block'
            }
            //now showing results
            else if($("#invResult").css('display') == 'block' && prevDisplay == 'none') {
                if(UPDATE_ON_ACTION) refreshInventory()
                if(DISABLE_REFRESH) disableRefresh()
                prevDisplay = 'block'
            }
            //no longer showing results
            else if($("#invResult").css('display') == 'none' && prevDisplay == 'block') {
                prevDisplay = 'none'
            }
        }
        //adds unclickable shade if loading
        else {
            document.getElementById("invpopupshade__2020").setAttribute("style", "display: block;")
        }
    })
    resultObs.observe(document.getElementById("invResult"), {attributes:true})

    let reload = false
    reloadImages()

    //================
    // functionalities
    //================

    function disableRefresh(addButton = true) {
        document.getElementById("invpopupshade__2020").setAttribute("style", "display: none;")
        document.getElementById("navpopupshade__2020").setAttribute("style", "display: block;")
        //updates the button to not refresh
        $("#invResult > div.popup-header__2020 > a")[0].removeAttribute("href")
        $("#invResult > div.popup-header__2020 > a > div")[0].setAttribute("onclick", "togglePopup__2020()")
        //adds refresh button
        if(addButton) {
            let a = getRefreshButton()
            $("#invResult > div.popup-body__2020")[0].appendChild(a)
        }
    }

    function getRefreshButton() {
        let a = document.createElement("a")
        a.href = "/inventory.phtml"
        let button = document.createElement("div")
        button.classList.add("button-default__2020", "button-yellow__2020", "btn-single__2020")
        button.innerHTML = "Refresh Page"
        a.appendChild(button)
        return a
    }

    function rememberSelections() {
        $("#iteminfo_select_action > select").change(() => {
            let option = $("#iteminfo_select_action").find("option:selected").val()
            let itemname = document.getElementById("invItemName").innerHTML
            let list = GM_getValue("invselect", {})
            list[itemname] = option
            GM_setValue("invselect", list)
            console.log(`[Inv+] Selection remembered for item '${itemname}'`)
        })
    }

    function setRememberedSelection() {
        let itemname = document.getElementById("invItemName").innerHTML
        let memory = GM_getValue("invselect", {})[itemname]
        if(memory != undefined) {
            $("#iteminfo_select_action > select")[0].value = memory
            $("#iteminfo_select_action > div.invitem-submit")[0].classList.remove("disabledButton")
            console.log(`[Inv+] Selection set for item '${itemname}'`)
        }
    }

    //you have to do this because neopets code put a lowercase instead of an uppercase in their code. incredible.
    function reloadImages() {
        let invObs = new MutationObserver((mutations) => {
            if(reload && $(`#invDisplay > div.inv-display:not([style="display: none;"])`).length && $('.lazy').length) {
                reload = false
                $('.lazy').Lazy({
                    threshold: 50,
                    visibleOnly: true,
                })
                console.log("[Inv+] Item images force-loaded.")
            }
        })
        invObs.observe($("#invDisplay")[0], {childList:true, subtree:true})
    }

    function refreshInventory() {
        // Temporary Loading Image
        $('#invDisplay' + 1).html("<br><br><br><div class='inv-loading-static'></div><p>Loading...</p>");

        $.get("https://www.neopets.com/inventory.phtml", ()=>{
            console.log("[Inv+] Refreshed inventory contents.")
            $("#tabs > div.inv-tabs-container > ul.invTabs > li.inv-tab-label.invTab-selected")[0].click() //refreshes the inventory tab
            reload = true
        })
    }

    function setStackView(type) {
        //if it's stacked and we want unstack
        if(type == "unstack" && $("#invStack > div.stack-icon-container.invfilter-active").length > 0) {
            document.getElementById("invStack").click()
        }
        //if it's unstacked and we want stacked
        else if(type == "stack" && $("#invStack > div.unstack-icon-container.invfilter-active").length > 0) {
            document.getElementById("invStack").click()
        }
        //simply toggles it
        else document.getElementById("invStack").click()
    }
})(jQuery)