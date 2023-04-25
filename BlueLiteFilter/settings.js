const default_settings = {"settings": { hard_hide: false, follow_limit: 100000 }};

// set default settings if the extension is newly installed
chrome.storage.sync.get("settings", function(res){
    if (typeof res.settings === 'undefined') {
        chrome.storage.sync.set(default_settings);
    }
});

function saveOptions(e) {
    e.preventDefault();

    const settings =  {
        hard_hide: document.querySelector("#hard-hide").checked == 1,
        follow_limit: document.querySelector("#threshold").value
    }

    chrome.storage.sync.set({settings: settings });
    console.log(settings);
    window.postMessage({ type: "settingsUpdate", params: settings }, "*");
}

function restoreSettings() {
    chrome.storage.sync.get("settings", function(res){
        if (typeof res.settings === 'undefined') {
            document.querySelector("#hard-hide").checked = default_settings["settings"]["hard_hide"];
            document.querySelector("#threshold").value = default_settings["settings"]["follow_limit"];
        }else {
            document.querySelector("#hard-hide").checked = res.settings.hard_hide;
            document.querySelector("#threshold").value = res.settings.follow_limit;
        }
    });
}

document.addEventListener("DOMContentLoaded", restoreSettings);
document.querySelector("form#block-settings").addEventListener("submit", saveOptions);