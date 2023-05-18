async function saveOptions(e) {
    e.preventDefault();

    let settings = {};

    settings.hard_hide = document.querySelector("#hard-hide").checked === true;
    settings.hide_promote = document.querySelector("#hide-promote").checked === true;
    settings.allow_affiliate = document.querySelector("#allow-affiliate").checked === true;
    settings.follow_limit = document.querySelector("#threshold").value;

    chrome.runtime.sendMessage({ method: 'setSettings', data: settings});

    window.close();
}

function restoreSettings() {
    chrome.runtime.sendMessage({ method: 'getSettings'}, async function(settings) {
        document.querySelector("#version-number").innerText = 'BlueLiteBlocker v' + settings.version;
        document.querySelector("#hard-hide").checked = settings.hard_hide;
        document.querySelector("#hide-promote").checked = settings.hide_promote;
        document.querySelector("#allow-affiliate").checked = settings.allow_affiliate;
        document.querySelector("#threshold").value = settings.follow_limit;
    });
}

document.addEventListener("DOMContentLoaded", restoreSettings);
document.querySelector("form#block-settings").addEventListener("submit", saveOptions);
