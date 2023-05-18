const default_settings = {
    version: "0.0.0.8",
    config_ver: 5,
    hide_promote: false,
    hard_hide: false,
    allow_affiliate: true,
    follow_limit: 100000
};

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
const set_extension_settings = async function(settings) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set({'settings': settings}, function() {
                resolve();
            });
        } catch (ex) {
            reject(ex);
        }
    });
};

async function settings_manager(obj, sender, sendResponse) {
    const settings = await get_extension_settings();
    switch(obj.method) {
        case 'setSettings':
            let new_settings = Object.assign(settings, obj.data);
            await set_extension_settings(new_settings);
            console.log('saved settings');
            console.log(obj.data);
            break;

        case 'getSettings':
            console.log('get settings');
            console.log(settings);
            await sendResponse(settings);
            break;

        default:
            console.log(`invalid method ${obj.method}`);
    }
}

async function install_settings() {
    chrome.runtime.onMessage.addListener((req, sender, resp) => {
        settings_manager(req, sender, resp);
        return true;
    });

    let settings = await get_extension_settings();
    if (Object.keys(settings).length === 0) {
        settings = default_settings;
        await set_extension_settings(settings);
    }

    // if old settings version is detected, merge with new version
    if(typeof settings.config_ver === 'undefined' || settings.config_ver !== default_settings.config_ver) {
        settings = Object.assign(default_settings, settings);
        settings.config_ver = default_settings.config_ver;
        console.log('new version');
        console.log(settings);
        await set_extension_settings(settings);
    }
}

install_settings().then((value) => {
    console.log('settings installed');
});