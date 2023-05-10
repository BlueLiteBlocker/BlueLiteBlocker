const default_settings = { version: "0.0.0.8", config_ver: 4, hard_hide: false, allow_affiliate: true, follow_limit: 100000 };

// listen for setting changes and forward it to extension
chrome.storage.onChanged.addListener((changes) => {
    if (typeof changes.settings !==  'undefined' && typeof changes.settings.newValue !== 'undefined') {
        const settings = changes.settings.newValue;
        send_settings_event(settings);
    }
});

// synchronous get extension settings
const get_extension_settings = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get('settings', function (result) {
            if (result['settings'] === undefined) {
                resolve({});
            } else {
                resolve(result['settings']);
            }
        });
    });
};

// synchronous set extension settings
const write_local_storage = async function(obj) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set(obj, function() {
                resolve();
            });
        } catch (ex) {
            reject(ex);
        }
    });
};

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
    let settings = await get_extension_settings();
    if (Object.keys(settings).length === 0) {
        settings = default_settings;
        await write_local_storage({'settings': settings});
    }

    // if old settings version is detected, merge with new version
    if(typeof settings.config_ver === 'undefined' || settings.config_ver !== default_settings.config_ver) {
        settings = Object.assign(default_settings, settings);
        settings.config_ver = default_settings.config_ver;
        console.log('new version');
        console.log(settings);
        await write_local_storage({'settings': settings});
    }

    // inject BlueLiteBlocker worker script into webpage
    let s = document.createElement('script');
    s.type = "text/javascript";
    s.async = false;
    s.src = chrome.runtime.getURL('xhr_hook.js');
    document.documentElement.appendChild(s);
    s.onload = function() {
        this.remove();
        send_settings_event(settings);
    };
}

install_extension().then(response => {
    console.log('done loading');
});