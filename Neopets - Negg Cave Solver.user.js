// ==UserScript==
// @name         Neopets - Negg Cave Solver <MettyNeo>
// @version      1.0
// @description  Uses TDN's Negg Solver to autofill the solution to 99.9% of puzzles
// @author       Metamagic
// @match        https://www.neopets.com/shenkuu/neggcave/
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @icon         https://i.imgur.com/RnuqLRm.png
// @require      https://thedailyneopets.com/uploads/js/negg-puzzle-solver.js
// ==/UserScript==

// You are free to modify this script for personal use but modified scripts must not be shared publicly without permission.
// Feel free to contact me at @mettymagic on discord for any questions or inquiries. ^^

// Trans rights are human rights ^^
// metty says hi

const PLACEMENT_DELAY = 25 //delay between tile autofills in ms, set to 0 to disable delay (default: 25)

//TDN's solver returns tiles indexed from 0-8 but we need shape & color indexes to place
const TILE_MAP = {
    //blue
    0: {c:0, s:0}, //swirl
    1: {c:0, s:1}, //fire
    2: {c:0, s:2}, //wind
    //red
    3: {c:1, s:0}, //swirl
    4: {c:1, s:1}, //fire
    5: {c:1, s:2}, //wind
    //yellow
    6: {c:2, s:0}, //swirl
    7: {c:2, s:1}, //fire
    8: {c:2, s:2}  //wind
}

if(GM_getValue("autosolve") == null) GM_setValue("autosolve", false)

if($("#mnc_negg_grid").length > 0) {
    addNeggSolverUI()
    if(GM_getValue("autosolve")) $("#ncs-button")[0].click()
}

function addNeggSolverUI() {
    $("#mnc_bg")[0].innerHTML += `
         <div id="ncs-status">
            <div id="ncs-msg">Thanks to TheDailyNeopets for the lovely solver!</div>
            <div id="ncs-toggle">
                <p>Auto-Solve</p>
                <label class="switch">
                    <input type="checkbox"><span class="slider round"></span>
                </label>
            </div>
        </div>
        <div id="ncs-button">SOLVE!</div>
    `

    if(GM_getValue("autosolve")) $("#ncs-toggle > label > input")[0].checked = true
    $("#ncs-toggle > .switch > input")[0].addEventListener("click", toggleAutoSolve)
    $("#ncs-button")[0].addEventListener("click", ()=>{$("#ncs-msg")[0].innerHTML = "Finding solution..."; setTimeout(()=>{solveNeggPuzzle()}, 500);})
}

function toggleAutoSolve() {
    GM_setValue("autosolve", !GM_getValue("autosolve"))
    console.log("[NCS] Toggled auto-solve.")
}

async function solveNeggPuzzle() {
    console.log("[NCS] Finding puzzle solution...")
    let source = new XMLSerializer().serializeToString(document);
    let solution = SolvePuzzle(source) //thanks TDN!
    console.log("[NCS] Solution found, autofilling grid...")
    $("#ncs-msg")[0].innerHTML = "Solution found, filling grid..."

    let i = 0
    function solveLoop() {
        setTimeout(() => {
            placeTile(i, solution[i])
            i++
            if(i < 9) solveLoop()
            else {
                console.log("[NCS] Negg Puzzle solved!")
                $("#ncs-msg")[0].innerHTML = "Negg Puzzle solved, thanks TheDailyNeopets!"
            }
        }, PLACEMENT_DELAY)
    }

    solveLoop()
}

function placeTile(i, n) {
    let tile = TILE_MAP[n]
    clickTile(tile.s, tile.c, i)
}

function clickTile(s, c, i) {
    let symbol = $(`#mnc_parch_ui_symbol_${s}`)[0]
    if(!symbol.classList.contains("selected")) symbol.click()
    let color = $(`#mnc_parch_ui_color_${c}`)[0]
    if(!color.classList.contains("selected")) color.click()
    $("#mnc_negg_grid")[0].children[i].click()
}

document.head.appendChild(document.createElement("style")).innerHTML = `
    /*this css is a mess please do not use this as example*/
    #ncs-button {
        left: 464px;
        top: 23px;
        display: block;
        position: relative;
        background: linear-gradient(110.1deg, rgb(34, 126, 34) 2.9%, rgb(168, 251, 60) 90.3%);
        border: 4px solid black;
        border-radius: 100%;
        width: 70px;
        height: 70px;
        text-align: center;
        line-height: 70px;
        font-size: 22px;
        font-family: Impact;
    }

    #ncs-status {
        background-color: #C9B483;
        border: 4px solid #706449;
        border-radius: 25%;
        padding: 4px;
        width: 180px;
        height: 90px;
        display: flex;
        position: relative;
        justify-content: center;
        flex-direction: column;
        top: 2%;
        left: 73%;
    }
    #ncs-toggle {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 20px;
        padding: 10px;
        text-align: center;
    }
    #ncs-msg {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    #ncs-toggle > p {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    /* modified from https://www.w3schools.com/howto/howto_css_switch.asp */
    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 23px;
      margin-left: 6px;
      font-size: 0.9em;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: .4s;
      transition: .4s;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 17px;
      width: 17px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      -webkit-transition: .4s;
      transition: .4s;
    }
    input:checked + .slider {
      background-color: #2196F3;
    }
    input:focus + .slider {
      box-shadow: 0 0 1px #2196F3;
    }
    input:checked + .slider:before {
      -webkit-transform: translateX(17px);
      -ms-transform: translateX(17px);
      transform: translateX(17px);
    }
    .slider.round {
      border-radius: 34px;
    }
    .slider.round:before {
      border-radius: 50%;
    }
`
