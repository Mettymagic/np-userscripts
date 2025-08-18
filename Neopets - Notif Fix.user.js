// ==UserScript==
// @name         Neopets - Fuck Fake Notifs
// @version      2025-08-18.0
// @icon         https://i.imgur.com/RnuqLRm.png
// @description  "newsNotifCount = 2;" my ASS
// @author       Mettymagic
// @match        https://www.neopets.com/*
// @grant        none
// ==/UserScript==

let isBeta = false
if ($("[class^='nav-pet-menu-icon']").length) isBeta = true

if(isBeta) {
    let realCount = parseInt($("#NavAlertsNotif")[0].innerHTML) - newsNotifCount
    newsNotifCount = 0; // eslint-disable-line
    updateNewsNotification(newsNotifCount);

    if(realCount > 0) setDotOnBellIcon(realCount);
    else $("#NavAlertsNotif")[0].style = "display:none;"
}
