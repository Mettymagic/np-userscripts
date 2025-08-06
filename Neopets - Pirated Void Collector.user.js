// ==UserScript==
// @name         Neopets - Pirated Dr. Landelbrots Void Attractor <MettyNeo>
// @version      2025-08-06.1
// @description  Click to collect all void essences
// @author       Mettymagic
// @match        *://www.neopets.com/tvw/
// @match        *://neopets.com/tvw/
// @connect      jellyneo.net
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Pirated%20Void%20Collector.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Pirated%20Void%20Collector.user.js
// ==/UserScript==

const COLLECT_DELAY = 500 // in ms, turn up if you're getting errors
const VAC_ICON = "https://cdn.imgchest.com/files/y8xcn23qr24.gif"
const JN_LINK = "https://www.jellyneo.net/?go=the_void_within&id=essence_collection" // sorry Dave from Jellyneo

if(window.location.href.includes("/tvw/")) {
    let vc_list = $("#VoidCollectionTrack > div > .vc-item:not(.locked)")
    let vc = vc_list[vc_list.length-1]
    // if not complete, add void collector
    if(!vc.classList.contains("complete")) {
        vc.classList.add("mn-vacuum")
        addTVWCSS()
    }
    $(".mn-vacuum:not(.mn-working)").click(collectEssence)
}

const DATE_REGEX = /.*\(.* (.*)\).*/m

function collectEssence() {
    let vac = $(".mn-vacuum")[0]
    if(vac?.classList?.contains("mn-working")) return

    console.log("[PVA] Requesting locations from Jellyneo")
    vac.classList.add("mn-working")
    GM_xmlhttpRequest({
        url: JN_LINK,
        headers: {"Content-Type": "text/html"},
        onload: function(response) {
            let doc = new DOMParser().parseFromString(response.responseText, "text/html")
            let a = doc.querySelector("#layout-content-row-wrapper > div > div > div > div.large-10.columns.content-wrapper > div:nth-child(4)")
            let aText = a.textContent.trim().split("\n")[0]
            let aDate = DATE_REGEX.exec(aText)[1]

            if (aDate != getDate()) locationsNotUpdated()
            else visitLocations(a.querySelectorAll("a:not(:last-of-type)"))
        },
        onerror: function(e) {console.error(`[PVA] ${e}`)}
    })
}

async function visitLocations(locs) {
    let j = 0
    while(j < locs.length) {
        let loc = locs[j].href
        console.log("[PVA] Visiting " + loc)

        let essences = await visit(loc)
        if(essences == null) {
            console.log(`[PVA] No essences found at ${loc}.`)
        }
        else {
            console.log(`[PVA] ${essences.length} essence${essences.length>1?"s":""} found at ${loc}, collecting...`)
            let i = 0
            while(i < essences.length) {
                await sendForm(essences[i])
                i += 1
                if(i < essences.length || j < locs.length-1) {
                    console.log(`[PVA] Waiting ${COLLECT_DELAY}ms...`)
                    await new Promise(r => setTimeout(r, COLLECT_DELAY))
                }
                /*console.log("Temp Manual Abort")
                $(".mn-vacuum")[0].classList.remove("mn-working")
                $(".mn-vacuum")[0].classList.remove("mn-vacuum")
                return*/
            }
        }
        j += 1
    }
    endCollection()
}

const ESSENCE_REGEX = /.*placeEssenceOnMap\((\[.*\])\).*/s
function visit(url) {
    return new Promise((resolve, reject) => {
        $.get(url, function(data) {
            let doc = new DOMParser().parseFromString(data, "text/html")
            let map = doc.querySelector("#container__2020 > div.map_container")
            let reg = ESSENCE_REGEX.exec(map.innerHTML)
            if(reg == null) resolve(null)
            else resolve(JSON.parse(reg[1]))
        })
    })
}

const REFCK_REGEX = /function getCK().*'(.*)'.*/s
function sendForm(ess) {
    let formData = new FormData()

    for(let key of Object.keys(ess)) formData.append(key, ess[key])
    formData.append("_ref_ck", getCK())
    console.log(`[PVA] Sending essence collection form... (ID:${ess.id})`)

    return new Promise((resolve, reject) => {
        fetch('/np-templates/ajax/plots/tvw/void-collection/collect_void.php', {
            method: "POST",
            headers: {'x-requested-with': 'XMLHttpRequest'},
            body: formData,
        })
        .then(function (response) {
            if (response.status !== 200) {
                console.error(`[PVA] Form response returned error! Response included below.`)
                console.error(response)
                resolve(false)
            }
            response.json().then(function (data) {
                if (data.success) {
                    addProgress()
                    resolve(true)
                }
                else {
                    console.error(`[PVA] Form response returned failure flag! Data included below.`)
                    console.error(data)
                    resolve(false)
                }
            })
        })
        .catch(function (err) {
            console.error("[PVA] Fetch Error :-S", err)
            resolve(false)
        });
    })
}

function endCollection() {
    $(".mn-vacuum")[0].classList.remove("mn-working")
    let amt = 10 - parseInt($(".mn-vacuum .vc-progress-amt")[0].innerHTML.split("/")[0])
    if(amt > 0) {
        alert(`Failed to collect ${amt} essences, try collecting again.\n\nThis can happen because of site lag - increasing the COLLECT_DELAY value (line 16) can help.`)
    }
    else {
        //alert("Successfully collected every essence!")
        $(".mn-vacuum")[0].classList.remove("mn-vacuum")
    }
}

function addProgress() {
    const txt = $(".mn-vacuum .vc-progress-amt")[0]
    const bar = $(".mn-vacuum .vc-progress-bar")[0]
    let amt = parseInt(txt.innerHTML.split("/")[0])
    amt += 1
    txt.innerHTML = `${amt}/10`
    bar.style = `width: calc(${amt} / 10 * 100%);`
    console.log(`[PVA] Essence ${txt.innerHTML} collected!`)
}

function locationsNotUpdated() {
    alert("JellyNeo hasn't posted today's locations yet, try again later!")
    console.log("[PVA] Locations not up-to-date, aborting.")
    $(".mn-vacuum")[0].classList.remove("mn-working")
    $(".mn-vacuum")[0].classList.remove("mn-vacuum")
}

function getDate() {
    return new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).split("/")[1]
}

function addTVWCSS() {
    document.head.appendChild(document.createElement("style")).innerHTML = `
        .mn-vacuum > .vc-progress {
            overflow: visible !important;
        }
        .mn-vacuum > .vc-progress > .vc-progress-bar {
            border-radius: 20px;
        }
        .mn-working > .vc-essence {
            background: url(${VAC_ICON}) !important;
            background-size: contain !important;
            animation: shake 0.1s;
            animation-iteration-count: infinite;
        }
        .mn-vacuum:not(.mn-working):hover > .vc-essence {
            background: url(${VAC_ICON}) !important;
            animation: shake 0.4s;
            background-size: contain !important;
        }
        .mn-vacuum:not(.mn-working):hover {
            transition: all 0.4s;
            background-color: white !important;
            border-color: #341B88 !important;
        }
        .mn-vacuum:not(.mn-working):hover > .vc-progress::after {
            content: 'Collect!';
            background-color: #814DD4;
            color: white;
            text-align: center;
            padding: 0 5px;
            border-radius: 20px;
            border: solid 1px #341B88;
            position: absolute;
            z-index: 100;
            width: fit-content;
            overflow: auto;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    `
}