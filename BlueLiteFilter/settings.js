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