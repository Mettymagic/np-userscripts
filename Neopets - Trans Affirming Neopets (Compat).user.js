// ==UserScript==
// @name         Neopets - Trans Affirming Neopets (Userscript Compat) <MettyNeo>
// @version      1.0
// @description  made this script to hide my own deadname so i can stream shit to my friends lol. probably not perfect.
// @author       You
// @match        *://www.neopets.com/*
// @match        *://neopets.com/*
// @icon         https://i.imgur.com/RnuqLRm.png
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// ==/UserScript==

//make sure this script is the last of your userscripts to load!

//pairs are in form of a regex statement and a string.
//if you don't know code stuff, just use '/name/ig' to case-insensitive match
const REPLACE_PAIRS = [
    //[/xXbeli3berXx/gi, "coolername07"],
    //[/muffin/gi, "Your Mom"]
]
replaceDeadNames()

function replaceDeadNames() {
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        //filters out nodes with only whitespace
        acceptNode: function (node) {
            if(node.nodeValue.trim()) return NodeFilter.FILTER_ACCEPT
            else return NodeFilter.FILTER_SKIP
        }
    }, false)

    //walk through each node and replace
    let node = null
    while (node = walker.nextNode()) {
        for(const pair of REPLACE_PAIRS) {
            node.nodeValue = node.nodeValue.replace(pair[0], pair[1])
        }
    }
}

$("#transhide")[0]?.remove()