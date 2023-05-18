// listen for setting changes and forward it to extension
chrome.storage.onChanged.addListener((changes) => {
    if (typeof changes.settings !==  'undefined' && typeof changes.settings.newValue !== 'undefined') {
        const settings = changes.settings.newValue;
        send_settings_event(settings);
        console.log('sent settings event');
    }
});

// send settings to the worker script via browser event
function send_settings_event(settings) {
    if(typeof cloneInto === 'function') {
        settings = cloneInto(settings, document.defaultView);
    }
    const settings_event = new CustomEvent("BLFsettingsUpdate", {detail: settings});
    window.dispatchEvent(settings_event);
}

// install extension
async function install_extension() {
    // inject BlueLiteBlocker worker script into webpage
    let s = document.createElement('script');
    s.type = "text/javascript";
    s.async = false;
    s.src = chrome.runtime.getURL('xhr_hook.js');
    document.documentElement.appendChild(s);
    s.onload = function() {
        this.remove();
        chrome.storage.sync.get('settings', function (settings) {
            console.log(settings.settings);
            send_settings_event(settings.settings);
        });
    };
}

install_extension().then(response => {
    console.log('done loading');
});