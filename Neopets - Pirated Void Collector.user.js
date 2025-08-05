// ==UserScript==
// @name         Neopets - Pirated Dr. Landelbrots Void Attractor <MettyNeo>
// @version      2025-08-05
// @description  Click to collect all void essences
// @author       Mettymagic
// @match        *://www.neopets.com/tvw/
// @match        *://neopets.com/tvw/
// @require      https://images.neopets.com/plots/tvw/activities/void-collection/vc.js
// @connect      jellyneo.net
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/Mettymagic/np-userscripts/blob/main/Neopets%20-%20Pirated%20Void%20Collector.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/blob/main/Neopets%20-%20Pirated%20Void%20Collector.user.js
// ==/UserScript==

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
    if(vac.classList.contains("mn-working")) return

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
    for(let loc of locs) {
        console.log("[PVA] Visiting " + loc.href)

        let essences = await visit(loc.href)
        if(essences == null) {
            console.log("[PVA] No essences found at " + loc.href)
        }
        else {
            for(let e of essences) await sendForm(e)
        }
    }
    $(".mn-vacuum")[0].classList.remove("mn-working")
    $(".mn-vacuum")[0].classList.remove("mn-vacuum")
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
    console.log("[PVA] Attempting to collect essence...")

    return new Promise((resolve, reject) => {
        fetch('/np-templates/ajax/plots/tvw/void-collection/collect_void.php', {
            method: "POST",
            headers: {'x-requested-with': 'XMLHttpRequest'},
            body: formData,
        })
        .then(function (response) {
            if (response.status !== 200) console.log("[PVA] Error collecting essence!")
            response.json().then(function (data) {
                if (data.success) {
                    addProgress()
                    resolve(true)
                }
                else {
                    console.log(`[PVA] Failed to collect essence!`)
                    resolve(false)
                }
            })
        })
        .catch(function (err) {
            console.log("Fetch Error :-S", err)
            resolve(false)
        });
    })

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