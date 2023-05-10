function saveOptions(e) {
    e.preventDefault();

    chrome.storage.sync.get("settings", function(res) {
        res.settings.hard_hide = document.querySelector("#hard-hide").checked === true;
        res.settings.allow_affiliate = document.querySelector("#allow-affiliate").checked === true;
        res.settings.follow_limit = document.querySelector("#threshold").value;

        chrome.storage.sync.set({settings: res.settings });
        window.close();
    });
}

function restoreSettings() {
    chrome.storage.sync.get("settings", function(res) {
            document.querySelector("#version-number").innerText = 'BlueLiteBlocker v' + res.settings.version;
            document.querySelector("#hard-hide").checked = res.settings.hard_hide;
            document.querySelector("#allow-affiliate").checked = res.settings.allow_affiliate;
            document.querySelector("#threshold").value = res.settings.follow_limit
    });
}

document.addEventListener("DOMContentLoaded", restoreSettings);
document.querySelector("form#block-settings").addEventListener("submit", saveOptions);