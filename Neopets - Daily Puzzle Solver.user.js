// ==UserScript==
// @name         Neopets - Daily Puzzle Solver <MettyNeo>
// @version      1.4.1
// @description  Uses TheDailyNeopets' daily puzzle answers to automatically select the correct daily puzzle answer
// @author       Metamagic
// @icon         https://i.imgur.com/RnuqLRm.png
// @match        https://www.neopets.com/community*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Daily%20Puzzle%20Solver.user.js
// @updateURL    https://github.com/Mettymagic/np-userscripts/raw/main/Neopets%20-%20Daily%20Puzzle%20Solver.user.js
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

//resets stored answer on new day
let date = getDate()
if(date != GM_getValue("date")) GM_deleteValue("dailypuzzle")
GM_setValue("date", date)

//saves the answer in case user comes back
let dp = GM_getValue("dailypuzzle")
addStatusDisplay()

//no saved answer, get from TDN
if(dp == null) requestTDNPage()

//saved answer, use it
else setAnswer(dp)

//adds the status display message
function addStatusDisplay() {
    if($("input[name='subbyvote']").length > 0 || $("input[name='pollres']").length > 0) return

    let cont = document.createElement("div")
    cont.style = "justify-content: flex-end; display: flex; align-items: center; margin-right: 12px; "

    let div = document.createElement("p")
    div.width = "16px !important"
    div.height = "16px !important"
    div.classList.add("question")
    div.style.fontSize = "14px"
    div.style.color = "gray"
    div.style.textAlign = "right"
    div.id = "dps_status"

    let img = document.createElement("div")
    img.style.opacity = "0.5"
    img.innerHTML = `
        <a href="https://thedailyneopets.com/" target="_blank" title="Visit TheDailyNeopets" style="cursor:pointer;"><img src="https://www.google.com/s2/favicons?sz=64&domain=thedailyneopets.com" width="16px" height="16px"></a>
    `
    cont.appendChild(div)
    cont.appendChild(img)

    let parent = $("#community__2020 > div.community-top__2020 > div.puzzlepoll > div.puzzlepoll-container > div.dailypoll-left-content")[0]
    parent.appendChild(cont)
}

//parses the answer from TDN's page then selects said answer
function setAnswer(resp) {
    //right question, grab answer
    //note: we have to spam .trim().normalize() because of hidden ascii chars and weird spaces
    let s1 = cleanString(document.querySelector("div.question.sf:not(:has(div.question.sf))").innerHTML)
    let s2 = cleanString(resp.q)
    if(s1 === s2) {
        GM_setValue("dailypuzzle", resp)
        let select = $("select[name='trivia_response']")[0]
        //find option that matches the right answer
        let option = Array.from(select.children).find(
            (e) => cleanString(e.innerHTML).includes(cleanString(resp.a))
        )
        select.value = option.value
        $("#dps_status")[0].innerHTML = "Answer selected, thanks TDN!"
        $("#community__2020 > div.community-top__2020 > div.puzzlepoll > div.puzzlepoll-container > div.dailypoll-left-content > div:nth-child(2) > form > select")[0].style.backgroundColor = "#bae8bb"
    }
    //not on answer page
    else if(!(s1.includes("That is correct!") || s1.includes("Oops! Nice try"))){
        $("#dps_status")[0].innerHTML = "Answer not posted, check back later!"
        GM_deleteValue("dailypuzzle")
    }
}

function cleanString(str) {
    return str.trim().normalize().toLowerCase().replace(/\s+/g, ' ')
}

//gets the daily puzzle data from TDN's page
function requestTDNPage() {
    console.log("[DPS] Grabbing Daily Puzzle from TDN...")
    $("#dps_status")[0].innerHTML = "Checking TheDailyNeopets for answer..."
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://thedailyneopets.com/index/fca",
        onload: function(response) {
            console.log("[DPS] Response received!")
            let doc = new DOMParser().parseFromString(response.responseText, "text/html")
            //blame TDN for this absolute mess lol
            let question = doc.querySelector("body > table > tbody > tr:nth-child(2) > td:nth-child(3) > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div:nth-child(1) > div").innerHTML
            let answer = doc.querySelector("body > table > tbody > tr:nth-child(2) > td:nth-child(3) > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div:nth-child(2)").childNodes[2].nodeValue
            setAnswer({q: question, a: answer})
        }
    })
}


function getDate() {
    return new Date().toLocaleString("en-US", {timeZone: "PST"}).slice(0, 10).replace(",","")
}