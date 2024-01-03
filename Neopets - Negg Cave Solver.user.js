// ==UserScript==
// @name         Neopets - Negg Cave Solver <MettyNeo>
// @version      0.2
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
const REQUIRES_BUTTON_PRESS = false //set to true to add a button that solves when pressed, set to false to solve on load. (default: false)
//TODO add button
//TODO add status display and TDN credit

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

if($("#mnc_negg_grid").length > 0) solveNeggPuzzle()

function solveNeggPuzzle() {
    console.log("[NCS] Finding puzzle solution...")
    let source = new XMLSerializer().serializeToString(document);
    let solution = SolvePuzzle(source) //thanks TDN!
    console.log("[NCS] Solution found, autofilling grid...")

    let i = 0
    function solveLoop() {
        setTimeout(() => {
            placeTile(i, solution[i])
            i++
            if(i < 9) solveLoop()
            else console.log("[NCS] Negg Puzzle Solved!")
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
