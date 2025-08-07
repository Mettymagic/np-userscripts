// ==UserScript==
// @name         Neopets - Menuless Volunteering <MettyNeo>
// @version      2025-08-07.0
// @description  Collects rewards upon page visit and lets you assign every shift at once
// @author       Mettymagic
// @match        *://www.neopets.com/hospital/volunteer.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

const COLLECT_DELAY = 1000
const FUN_ALLOWED = true // disable if you're lame
const MAX_RETRIES = 2 // max number of retries if a request fails

const LARGE_ICON = "https://pets.neopets.com/cpn/%s/1/3.png"
const SMALL_ICON = "https://pets.neopets.com/cpn/%s/2/1.png"

function main() {
    addCSS()
    modifyUI()
    completeShifts()
}

//=================
// UI modifications
//=================

function modifyUI() {
    let div = $("#container__2020 > div.volunteer-centre.tvw")[0]
    let cont = document.createElement("div")
    cont.id = "mn-volunteer"
    cont.appendChild(div.children[0])
    div.prepend(cont)
    cont.appendChild(getPanel())
    $("#mv-exclude-button").click(()=>{setExclude()})
    $("#mv-assign-button").click(()=>{assignShifts()})
    if(FUN_ALLOWED) modifyDialogue()
}

function modifyDialogue() {
    $("#container__2020 > div.volunteer-centre.tvw > div.h5-dialogue.dialogue-lg > p:nth-child(2)")[0].innerHTML = `
        Welcome to the Neopian Hospital volunteer team! Apologies for the mess, we're currently overhauling the place to <i>hopefully</i> make things a bit more efficient. (Thanks Metty!)
    `
}

function getPanel() {
    let panel = document.createElement("div")
    panel.id = "mv-panel"
    panel.appendChild(getButtons())
    panel.appendChild(getSummary())
    let load = $("#VolunteerPetLoading .vc-loader")[0].cloneNode(true)
    load.innerHTML = load.innerHTML.replace("Loading...", `<span id="mv-status">(no status)</span>`)
    panel.appendChild(load)
    return panel
}

function getButtons() {
    let div = document.createElement("div")
    div.id = "mv-buttons"
    div.innerHTML = `
        <div id="mv-exclude">
            <div id="mv-exclude-display">
                <div class="vc-text">
                    <span id="mv-exclude-name"></span> <span>is exempt from duty!</span>
                </div>
                <div>
                    <div class="vc-image">
                        <img id="mv-exclude-img"></img>
                    </div>
                    ${FUN_ALLOWED?`<div id="mv-exclude-flavor" class="vc-text"></div>`:""}
                </div>
            </div>
            <button id="mv-exclude-button" class="plot-button vc-button button-default__2020 button-yellow__2020 btn-single__2020">Exclude a Pet!</button>
        </div>
        <button id="mv-assign-button" class="plot-button vc-button button-default__2020 button-yellow__2020 btn-single__2020">Assign Shifts</button>
    `
    return div
}

function getSummary() {
    let div = document.createElement("div")
    div.id = "mv-summary"
    return div
}

//============
// Exclude pet
//============

function setExclude() {
    let open = getOpen()
    console.trace()

    if(open == null) errorAlert("There needs to be an open shift to exclude a pet!<br><br><i>(Weird page limitation, just complete or cancel a shift. Sorry! ~MM)</i>")
    else showPets(open[0])
}

function setExcluded(pet) {
    if(pet) {
        GM_setValue("excludedpet", pet)
        document.getElementById("VolunteerPetList").classList.add("hide")
        document.getElementById("VolunteerFightInfo").classList.remove("hide")
    }
}

function showPets(id) {
	var pets = document.getElementById("VolunteerSelectPet");
	if (pets.classList.contains("hide")) {
		// Close any open popup
		if (document.querySelector("div.togglePopup__2020[style*='display: block']")) togglePopup__2020();

		// Show Loading Screen
		pets.classList.remove("hide");
		document.getElementById("VolunteerFightInfo").classList.add("hide");

		let formData = new FormData();
		formData.append("_ref_ck", getCK());
		formData.append("fight_id", id);

		document.getElementById("VolunteerErrMsg").innerHTML = "";

		fetch("/np-templates/ajax/plots/hospital/get-pets.php", {
		    method: "POST",
		    headers: {"x-requested-with": "XMLHttpRequest"},
			body: formData,
		})
		    .then(
		        function (response) {
		            if (response.status !== 200) {
		                console.log("Error setting state!");
		            }

					response.json().then(function (data) {
						if (data.success) {
							let petList = data.pets;
							petList.forEach((pet) => {
								addPetElement(pet);
							});
							if (document.getElementById("VolunteerPetLoading")) {
								document.getElementById("VolunteerPetLoading").remove();
							}
							document.getElementById("VolunteerPetList").classList.remove("hide");
                            let button = $("#VolunteerJoinButton")
                            button[0].removeAttribute("onclick")
                            button.click((event)=>{ setExcluded(event.target.getAttribute("data-pet")) })
                            button[0].innerHTML = "Exclude Me!"
						}
	                    if (data.error) {
							document.getElementById("VolunteerErrMsg").innerHTML = data.errMsg
							togglePopup__2020(document.getElementById("VolunteerErrorPopup"))
	                    }
	                });
		        }
		    )
		    .catch(function (err) {
		        console.log("Fetch Error :-S", err);
		    });
	}
}

function addPetElement(pet) {
	var samplePet = document.getElementById("VolunteerPet")

	var newPet = samplePet.cloneNode(true)
    //newPet.removeAttribute("onclick")
    //newPet.removeAttribute("onkeyup")
	newPet.removeAttribute("id")
    newPet.querySelector(".vc-tooltip-icon").remove()

	let petImg = newPet.querySelector(".vc-image img")
	petImg.src = pet.image;
	petImg.alt = pet.name;

	newPet.querySelector(".vc-name").innerHTML = pet.name;

	newPet.setAttribute("data-petname", pet.name);
	document.getElementById("VolunteerPetList").appendChild(newPet);
}

//==================
// Completing shifts
//==================

let cItems = []
let cPoints = 0
let cPointsCapped = false
let cAvatar = ""
let numCollected = 0

async function completeShifts() {
    let arr = getCompleted()
    if(arr == null) {
        console.log("[MV] No shifts to be completed detected.")
    }
    else {
        let num = arr.length
        $("#mv-panel")[0].classList.add("loading")
        $("#mv-status")[0].innerHTML = `Collecting shifts... <span>(0/${num})</span>`
        let err = 0
        let status = $("#mv-status > span")[0]
        while(arr.length > 0) {
            console.log(`[MV] ${err>0?"Re-a":"A"}ttempting to collect shift ${numCollected}/${num}...`)
            let success = await collectShift(arr[0])
            if(success) {
                numCollected += 1
                console.log(`[MV] Shift ${numCollected}/${num} collected successfully.`)
                arr = arr.slice(1)
            }
            else {
                err += 1
                if(err > MAX_RETRIES) {
                    console.error(`[MV] Max retries reached, skipping shift.`)
                    arr = arr.slice(1)
                    num -= 1
                    err = 0
                }
            }
            status.innerHTML = `(${numCollected}/${num}${err?`, ${err}/${MAX_RETRIES+1} Fails`:""})`

            if(arr.length > 0) {
                console.log(`[MV] Waiting ${COLLECT_DELAY}ms...`)
                await new Promise(r => setTimeout(r, COLLECT_DELAY))
            }
        }
        if(numCollected > 0) displayRewards()
        else errorAlert("Nothing was collected! Something must've gone horribly wrong...")
        $("#mv-panel")[0].classList.remove("loading")
    }
}

function displayRewards() {
    console.log(cItems)
    let body = $("#VolunteerFinishPopup > div.popup-body__2020")[0]
    body.innerHTML = body.innerHTML.replace(`<img id="VolunteerItemImg" class="item-single__2020"><br>`,"")
    body.innerHTML = body.innerHTML.replace(`<span id="VolunteerItemName"></span>`,"")
    body.insertBefore(getItemsDiv(), $("#VolunteerFinishPopup > div.popup-body__2020 > p:last-of-type")[0])
    $("#VolunteerFinishPopup > div.popup-body__2020 > p:first-of-type")[0].innerHTML = "This display is a work in progress, sorry!"
    togglePopup__2020(document.getElementById("VolunteerFinishPopup"))

    //$("#VolunteerItemImg")[0].classList.remove("item-single__2020")
}

function getItemsDiv() {
    let div = document.createElement("div")
    div.id = "mv-items"
    for(let item of cItems) {
        div.innerHTML += `<div class="mv-item"><img class="item-single__2020" src=${item.img}><span>${item.name}</span></div>`
    }
    return div
}

function collectShift(id) {
    return new Promise((resolve, reject) => {
        let formData = new FormData()
        formData.append("_ref_ck", getCK())
        formData.append("id", id)

        fetch("/np-templates/ajax/plots/hospital/volunteer-finish.php", {
            method: "POST",
            headers: {"x-requested-with": "XMLHttpRequest"},
            body: formData,
        })
            .then(
            function (response) {
                if (response.status !== 200) {
                    console.error("[MV] Collecting shift returned error!")
                    console.error(response)
                    resolve(false)
                }

                response.json().then(function (data) {
                    if (data.success) {
                        addReward(data)
                        clearFightInService(data.fight, data.time)
                        resolve(true)
                    }
                    if (data.error) {
                        console.error("[MV] Collecting shift returned error!")
                        console.error(data)
                        resolve(false)
                    }
                })
            }
        )
            .catch(function (err) {
            console.error("[MV] Fetch Error :-S", err)
        })
    })
}

function addReward(data) {
    cItems.push({img: data.itemImg, name: data.itemName})
    cPoints += data.points
    if(data.capped || !data.points) cPointsCapped = true
    if (data.avatarNotice) cAvatar.innerHTML += "<p>" + data.avatarMsg + "</p>" + data.avatarNotice;
}

// returns buttons
function getCompleted(i=null) {
    let list = Array.from($("#VolunteerFightInfo .vc-fights > .vc-fight.finished button")).map((e)=>{return e.getAttribute("data-id")})
    if(list.length == 0) return null
    else if (Number.isInteger(i) && i < list.length && i >= 0) return list[i]
    else return list
}
function getOpen(i=null) {
    let list = Array.from($("#VolunteerFightInfo .vc-fights > .vc-fight.open button")).map(getShiftID)
    if(list.length == 0) return null
    else if (Number.isInteger(i) && i < list.length && i >= 0) return list[i]
    else return list
}

const ID_REGEX = /VolunteerButton(.*)/
function getShiftID(button) {
    return ID_REGEX.exec(button.id)?.[1]
}

//===============
// Joining shifts
//===============

let pets = []
function assignShifts() {
    alert("Still haven't done this part yet, sorry! ~Metty")
}

function joinShift(id, pet) {
    let formData = new FormData()
    formData.append("_ref_ck", getCK())
    formData.append("fight_id", id)
    formData.append("pet_name", pet)

    fetch("/np-templates/ajax/plots/hospital/volunteer-join.php", {
	    method: "POST",
	    headers: {"x-requested-with": "XMLHttpRequest"},
		body: formData,
	})
	    .then(
	        function (response) {
	            if (response.status !== 200) {
	                console.log("Error setting state!");
	            }

				response.json().then(function (data) {
					if (data.success) {
						togglePopup__2020(document.getElementById("VolunteerJoinedPopup"));
						setFightInService(fight, data);
						showFights();
						let clock = new vcClock((data.time / 3600), 0, 0);
						intervals["fight"+fight+"Clock"] = setInterval(function() {
							clock.tick("fight",fight);
						}, 1000);
					}
                    if (data.error) {
						document.getElementById("VolunteerErrMsg").innerHTML = data.errMsg;
						togglePopup__2020(document.getElementById("VolunteerErrorPopup"));
                    }
					e.removeAttribute("disabled");
                });
	        }
	    )
	    .catch(function (err) {
	        console.log("Fetch Error :-S", err);
	    });
}


function errorAlert(text) {
    let err = document.getElementById("VolunteerErrorPopup")
    err.innerHTML = `
	    <div class="popup-header__2020">
		    <button tabindex="0" class=" popup-exit button-default__2020 button-red__2020" onclick="togglePopup__2020(this)">
			    <div class="popup-exit-icon"></div>
		    </button>
		    <h3>Error Occurred!!</h3>
		    <div class="popup-header-pattern__2020"></div>
	    </div>

	    <div class="popup-body__2020" style="max-height: 654.7px;">
		    <p id="VolunteerErrMsg">${text}</p>
	    </div>

	    <div class="popup-footer__2020 popup-grid3__2020">
		    <div></div>
		    <button tabindex="0" class="button-default__2020 button-purple__2020" onclick="togglePopup__2020(this)" style="display:none;">Back</button>
		    <div class="popup-footer-pattern__2020"></div>
	    </div>`
    togglePopup__2020(err)
}

function addCSS(){
    document.head.appendChild(document.createElement("style")).innerHTML = `
        #mn-volunteer .char-img-square {
            margin: 0;
        }
        #mn-volunteer {
            display: flex;
            box-sizing: border-box;
            width: 100%;
            padding: 0% 5%;
        }
        #mv-panel {
            border: 3px solid #FF52FD;
            box-shadow: 0 0 5px #FF52FD;
            width: 100%;
            padding: .5em 0;
            background: linear-gradient(180deg, #3F2F92 0%, #261870 100%);
            border-radius: 20px;
            margin-left: 5%;
            padding: 8px;
        }
        #mv-panel, #mv-panel * {
            display: flex;
            position: relative;
            box-sizing: border-box;
            justify-content: space-evenly;
        }
        #mv-buttons {
            width: 40%;
            flex-direction: column;
            padding-right: 3%;
        }
        #mv-summary {
            width: 60%;
            flex-direction: column;
        }
        #mv-exclude-display {
            color: white;
            font-weight: bold;
        }
        #mv-panel.loading > *:not(.vc-loader) {
            display: none;
        }
        #mv-panel:not(.loading) .vc-loader {
            display: none;
        }
        #mv-panel .vc-loader {
            display: block;
            position: absolute;
            width: max-content;
            padding: 4em 2em;
            margin: auto;
            color: #fff;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            box-sizing: border-box;
        }
        .hide {
            display: none !important;
        }
    `
}

// feel free to add your own!
const drDialogue = [
    "Welcome to the Neopian Hospital volunteer team! Your compassionate spirit will play a vital role in aiding- Gah, you've heard it already.",
    "Welcome to the Neopian Hospital volunteer team! Your corporate- I mean compassionate spirit, will play a vital role in aiding others in their difficult battles. Thank you for joining us in making a difference!",
    "Welcome to the Neopian Hospital volunteer team! Not much of a team though, I mean, have you even <i>seen</i> anyone else here??? Budget cuts these days... Regardless, thank you for joining us.",
    "Welcome to the Neopian Hospital volunteer team! I get it, you're here for prizes, but could you at least <i>pretend</i> to care next time you come by? Just take your stuff and leave.",
    "Welcome to the Neopian Hospital volunteer team! We emphasize acceptance of all species, cultures, and gender identities- unless you're an Eerie, then I want nothing to do with you.",
    "*snore* Mmggghgbh.... Cheese.,,...,.",
    "I hate you.",
    "Did you know that your own immune system can kill you in less than 15 minutes? Better get to work, bud.",
    "Would you like a second opinion? You are <i>also</i> ugly!",
    "I don't think we have enough body bags...",
    "Oops! That wasn't medicine! Whatever, just send 'em to the pound.",
    "Welcome to the Neopian Hospital volunteer team- AAAAAAAHHHHHH AWWWAOAOAAAAAAGAGAGAGAAAAhghghgbghbgbg bgbghlugb gbglub",
    "Welcome to the Neopian Hospital volunteer team! Everything is not on fire- well, for now, at least. Hey, is that a Sword of Reif in the prize shop?",
    "FFFFFFUUUUUUUUUUUUUCCCCKKKKK!!!!!!!!!!! Oh, don't mind me, just letting out some frustration. SSSSSHHHHIIIIII-",
    "The Neopian Hospital volunteer team would greatly appreciate it if you took a shower every once in a while.",
    "You didn't find it strange that their Neocancer pills were chewable? What, we're not made of neopoints like moneybags over here- Oh, you're here! Ignore that.",
    "You know, I'm not even a real doctor- that's just my first name, Doctor G. Would make for a sick street name though..."
]
const slackerDialogue = [
    "I was in Electrical",
    "I'm working from home",
    "My leg hurts",
    "I got hungry",
    "I'm too tired",
    "I blame you",
    "I'm on vacation",
    "I'm overqualified",
    "Haha suckers",
    "It's a holiday",
    "I'm on leave",
    "Get fucked",
    "I had a bad day",
    "I'm fighting baddies",
    "I'm a valued member of society",
    "AAAAAAAAAAAAA",
    "I found a funny meme",
    "Volunteering is lame"
]
const workerDialogue = [
    "Don't try this at home!",
    "Working hard or hardly working?",
    "Do I have to?",
    "I'm not a doctor!",
    "Is this even legal?",
    "Why do I have to do this?",
    "Couldn't you have chosen someone else?",
    "This won't be good for my skin...",
    "But I'm way above volunteering!",
    "Why are we doing this again?"
]

main()