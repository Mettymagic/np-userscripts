// ==UserScript==
// @name         Neopets - Daily Puzzle Solver
// @version      0.1
// @description  Uses TheDailyNeopets' daily puzzle answers to automatically select the correct daily puzzle answer
// @author       Metamagic
// @icon         https://i.imgur.com/RnuqLRm.png
// @match        https://www.neopets.com/community/
// @match        https://thedailyneopets.com/index/fca
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

//resets stored answer on new day
let date = getDate()
if(date != GM_getValue("date")) GM_deleteValue("dailypuzzle")
GM_setValue("date", date)

//saves the answer in case user comes back
let answer = GM_getValue("dailypuzzle")

//no saved answer, get from TDN
if(answer == null) {
    requestTDNPage()
}

//saved answer, use it
else {

}

function requestTDNPage() {
    console.log("[DPS] Grabbing Daily Puzzle from TDN...")
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://thedailyneopets.com/index/fca",
        onload: function(response) {
            let doc = new DOMParser().parseFromString(response.responseText, "text/html")
            let question = doc.querySelector("div.question.sf:not(:has(div.question.sf))").innerHTML
            console.log(question)
        }
    })
}


function getDate() {
    return new Date().toLocaleString("en-US", {timeZone: "PST"}).slice(0, 10).replace(",","")
}