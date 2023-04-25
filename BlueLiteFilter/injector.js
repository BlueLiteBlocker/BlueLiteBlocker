// send settings to the worker script via browser event
function send_settings_event() {
    chrome.storage.sync.get("settings", function(res){
        let settings = res.settings;
        if(typeof cloneInto === 'function') {
            settings = cloneInto(res.settings, document.defaultView);
        }
        console.log(res.settings);
        const settings_event = new CustomEvent("BLFsettingsUpdate", {detail: settings});
        window.dispatchEvent(settings_event);
    });
}

// listen for setting changes and forward it to extension
chrome.storage.onChanged.addListener((changes) => {
    console.log(changes);
    if (typeof changes.settings) {
        send_settings_event();
    }
});

// inject BlueLiteFilter worker script into webpage
let s = document.createElement('script');
s.type = "text/javascript";
s.async = false;
s.src = chrome.runtime.getURL('xhr_hook.js');
document.documentElement.appendChild(s);
s.onload = function() {
    this.remove();
    send_settings_event();
};