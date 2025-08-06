// ==UserScript==
// @name         Neopets - Menuless Volunteering <MettyNeo>
// @version      2025-08-06.0
// @description  Collects rewards upon page visit and lets you assign every shift at once
// @author       Mettymagic
// @match        *://www.neopets.com/hospital/volunteer.phtml*
// @icon         https://i.imgur.com/RnuqLRm.png
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Menuless%20Volunteering.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Menuless%20Volunteering.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

// Collection variables
let cItems = []
let cPoints = 0
let cPointsCapped = false
let cAvatar = ""
let numCollected = 0

// Joining variables
let pets = []

function main() {
    modifyUI()
    addCSS()
    //initPets()
    //showPets(3)
    //completeShifts()
}

function modifyUI() {
    let div = $("#container__2020 > div.volunteer-centre.tvw")[0]
    let cont = document.createElement("div")
    cont.id = "mn-volunteer"
    cont.appendChild(div.children[0])
    div.prepend(cont)
    cont.appendChild(getPanel())
}

function getPanel() {
    let panel = document.createElement("div")
    panel.classList.add("mv-panel")
    return panel
}

function initPets() {
    let open = getOpen()

    if(open.length == 0) errorAlert("There needs to be an open shift to initialize pets!")
    else showPets(open[0])
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

function completeShifts() {
    for(let button of getCompleted()) {
        console.log(button)
    }
}

function assignShifts() {
}

// returns buttons
function getCompleted(i=null) {
    let list = Array.from($("#VolunteerFightInfo .vc-fights > .vc-fight.finished button")).map(getID)
    if(list.length == 0) return null
    else if (Number.isInteger(i) && i < list.length && i >= 0) return list[i]
    else return list
}
function getOpen(i=null) {
    let list = Array.from($("#VolunteerFightInfo .vc-fights > .vc-fight.open button")).map(getID)
    if(list.length == 0) return null
    else if (Number.isInteger(i) && i < list.length && i >= 0) return list[i]
    else return list
}

const ID_REGEX = /VolunteerButton(.*)/
function getID(button) {
    return ID_REGEX.exec(button.id)?.[1]
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


/**
 * Show list of pets to choose for volunteering
 */
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
							document.getElementById("VolunteerErrMsg").innerHTML = data.errMsg;
							togglePopup__2020(document.getElementById("VolunteerErrorPopup"));
	                    }
	                });
		        }
		    )
		    .catch(function (err) {
		        console.log("Fetch Error :-S", err);
		    });
	}
}

function setExcluded(pet) {
    if(pet) {
        GM_setValue("excludedpet", pet)
        document.getElementById("VolunteerPetList").classList.add("hide")
        document.getElementById("VolunteerFightInfo").classList.remove("hide")
    }
}
/**
 * Add a new pet to the pets list
 * @param pet
 */
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

function displayRewards() {
    $("#VolunteerItemImg")[0].classList.remove("item-single__2020")
}

function collectShift(id) {
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
	            }

				response.json().then(function (data) {
					if (data.success) {
                        addReward(data)
                        clearFightInService(data.fight, data.time)
                    }
                    if (data.error) {
                        console.error("[MV] Collecting shift returned error!")
                        console.error(data)
                    }
                })
	        }
	    )
	    .catch(function (err) {
	        console.error("[MV] Fetch Error :-S", err)
	    })
}

function addReward(data) {
    cItems.push({img: data.itemImg, name: data.itemName})
    cPoints += data.points
    if(data.capped || !data.points) cPointsCapped = true
    if (data.avatarNotice) cAvatar.innerHTML += "<p>" + data.avatarMsg + "</p>" + data.avatarNotice;
    numCollected += 1
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
        .mv-panel {
            border: 3px solid #FF52FD;
            box-shadow: 0 0 5px #FF52FD;
            position: relative;
            width: 100%;
            padding: .5em 0;
            background: linear-gradient(180deg, #3F2F92 0%, #261870 100%);
            border-radius: 20px;
            box-sizing: border-box;
            margin-left: 5%;
            padding: 8px;
        }
    `
}

main()