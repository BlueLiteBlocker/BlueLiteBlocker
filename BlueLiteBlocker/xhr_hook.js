console.log("BlueLiteBlocker: loaded ext");

// todo: probably wait for settings rather than overwriting once we get sent them
let settings = {};

// add an event listener to receive settings update from extension config
window.addEventListener("BLFsettingsUpdate", function(event) {
    settings = event.detail;
});

class TwitterUser {
    constructor(handle, name, followers, verified_type, we_follow, is_bluecheck, is_blocked) {
        this.handle = handle;
        this.name = name;
        this.followers = followers;
        this.verified_type = verified_type;
        this.we_follow = we_follow;
        this.is_bluecheck = is_bluecheck;
        this.is_blocked = is_blocked;
    }
}

// hook XMLHttpRequest.open to filter API responses and remove any blue check tweets
let old_xml_open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function() {
    if (arguments.length >= 2 && arguments[0] !== "") {

        // hook HomeTimeline API to parse timeline tweets
        if (arguments[1].search('https://twitter.com/i/api/graphql/.*/HomeTimeline') !== -1) {
            if (!this._xhr_response_hooked) {
                this._xhr_response_hooked = true;
                set_response_hook(this, 'home');
            }
        }

        // hook TweetDetail API to parse tweet replies
        if (arguments[1].search('https://twitter.com/i/api/graphql/.*/TweetDetail') !== -1) {
            if (!this._xhr_response_hooked) {
                this._xhr_response_hooked = true;
                set_response_hook(this, 'replies');
            }
        }

        // hook search API to parse search and trending topics
        if (arguments[1].search('https://twitter.com/i/api/2/search/adaptive.json') !== -1) {
            if (!this._xhr_response_hooked) {
                this._xhr_response_hooked = true;
                set_response_hook(this, 'search');
            }
        }

        // hook notifications API to parse notification feed
        if (arguments[1].search('https://twitter.com/i/api/2/notifications/.*') !== -1) {
            if (!this._xhr_response_hooked) {
                this._xhr_response_hooked = true;
                set_response_hook(this, 'search');
            }
        }
    }
    old_xml_open.apply(this, arguments);
}

// overwrite the getter and setter of XMLHttpRequest.responseText to modify responses (surely there's a better way?)
function set_response_hook(xhr, timeline_type) {
    function getter() {
        delete xhr.responseText;
        let json = JSON.parse(xhr.responseText);
        parse_timeline(timeline_type, json);
        setup();

        return JSON.stringify(json);
    }

    function setter(str) {
        this._var = str;
    }

    function setup() {
        Object.defineProperty(xhr, 'responseText', {
            _var: '',
            get: getter,
            set: setter,
            configurable: true
        });
    }
    setup();
}

function hide_tweet(tweet_results, hard_hide) {
    if (tweet_results['result']['__typename'] === 'Tweet') {
        const old_tweet_results = structuredClone(tweet_results['result']);

        // prevent tweets from showing at all, instead of collapsing them
        if (hard_hide) {
            tweet_results['result']['__typename'] = '';
            return;
        }

        delete tweet_results['result'];

        // replace the tweet results with the collapse block casing the client to hide the tweet for us
        tweet_results['result'] = {
            "__typename": "TweetWithVisibilityResults",
            "tweet": old_tweet_results,
            "tweetInterstitial": {
                "__typename": "ContextualTweetInterstitial",
                "displayType": "EntireTweet",
                "text": {
                    "rtl": false,
                    "text": "This Twitter Blue tweet has been hidden to save your brain cells.",
                    "entities": []
                },
                "revealText": {
                    "rtl": false,
                    "text": "View",
                    "entities": []
                }
            }
        }
    }
}

function get_tweet_user_info(item_content) {
    // results with type 'Tweet' are normal tweets, 'TweetWithVisibilityResults' are tweets from accounts we blocked
    const allowed_type_names = ['TweetWithVisibilityResults', 'Tweet'];

    // only process results with type TimelineTweet (all tweets should have this type)
    if (item_content['itemType'] !== 'TimelineTweet') {
        console.warn(`invalid itemType: ${item_content['itemType']}`)
        return false;
    }

    // only process results with correct __typename
    if (!allowed_type_names.includes(item_content['tweet_results']['result']['__typename'])) {
        console.warn(`invalid __typename: ${item_content['itemType']}`)
        return false;
    }

    let tweet_data = item_content['tweet_results']['result'];

    // tweets of type 'TweetWithVisibilityResults' have a slightly different format we need to parse
    if (tweet_data['__typename'] === 'TweetWithVisibilityResults') {
        // the data we need is in a nested field called 'tweet'
        tweet_data = tweet_data['tweet'];
    }

    const user_data = tweet_data['core']['user_results']['result'];
    const legacy_user_data = user_data['legacy'];

    let verified_type = '';
    let following = false;
    let blocked = false;

    // if the account is Business or Government, it will have the 'verified_type' field set
    if ('verified_type' in legacy_user_data) {
        verified_type = legacy_user_data['verified_type'];
    }

    // if we are following the account it will have the 'following' field set
    if ('following' in legacy_user_data) {
        following = legacy_user_data['following'];
    }

    if ('blocking' in legacy_user_data) {
        blocked = legacy_user_data['blocking'];
    }

    return new TwitterUser(
        legacy_user_data['screen_name'],
        legacy_user_data['name'],
        legacy_user_data['followers_count'],
        verified_type,
        following,
        user_data['is_blue_verified'],
        blocked,
    );
}

// check if the user is Twitter Blue and meets the filter criteria
function is_bad_user(user) {
    /*
    only block Twitter blue users who meet the following criteria:
      - aren't a business account
      - aren't a government account
      - have less than X followers
      - aren't followed by us
    */
    return user.is_bluecheck
        && user.followers < settings.follow_limit
        && user.we_follow === false
        && user.verified_type === '';
}

function handleTweet(entry_type, item_content) {
    const user = get_tweet_user_info(item_content);

    if(is_bad_user(user)) {
        hide_tweet(item_content['tweet_results'], settings.hard_hide);
        console.log(`Tweet filtered from @${user.handle} (Blue User - ${user.followers} followers)`);
    }
}

function parse_search(json) {
    if (typeof json['globalObjects'] === undefined ||
        typeof json['globalObjects']['tweets']  === undefined ||
        typeof json['globalObjects']['users']  === undefined){
    }

    const tweets = json['globalObjects']['tweets'];
    const users = json['globalObjects']['users'];

    json['timeline']['instructions'].forEach(instruction => {
        if ('addEntries' in instruction) {
            instruction['addEntries']['entries'].forEach((entry, index) => {
                if ('item' in entry['content'] && 'clientEventInfo' in entry['content']['item']) {
                    if ('tweet' in entry['content']['item']['content']) {

                        // the search API is a complete mess, so we have to use index lookups and can't soft-hide tweets
                        const tweet_idx = entry['content']['item']['content']['tweet']['id'];
                        const tweet = tweets[tweet_idx];
                        const user_idx = tweet['user_id_str'];
                        const user_data = users[user_idx];

                        const user = new TwitterUser(
                            user_data['screen_name'],
                            user_data['name'],
                            user_data['followers_count'],
                            '',
                            user_data['following'],
                            user_data['ext_is_blue_verified'],
                            user_data['blocking']
                            );

                        if(is_bad_user(user)) {
                            // we can prevent tweets from being displayed by removing 'displayType'
                            //note: due to the way the client works, we can only remove tweets not collapse them.
                            entry['content']['item']['content']['tweet']['displayType'] = '';
                            console.log(`Tweet removed from @${user.handle} (Blue User - ${user.followers} followers)`);
                        }
                    }
                }
            });
        }
    });
}

function parse_timeline(timeline_type, json) {
    let instructions = [];

    switch (timeline_type) {
        case 'home':
            instructions = json['data']['home']['home_timeline_urt']['instructions'];
            break;

        case 'replies':
            instructions = json['data']['threaded_conversation_with_injections_v2']['instructions'];
            break;

        case 'search':
            parse_search(json);
            return;

        default:
            console.warn(`parse_timeline got bad type ${timeline_type}`);
            return;

    }

    instructions.forEach(instruction => {
        if (instruction['type'] !== 'TimelineAddEntries')
            return;

        let tweet_entries = instruction['entries'];

        tweet_entries.forEach(entry => {
            switch (entry['content']['entryType']) {
                // handle regular tweets
                case 'TimelineTimelineItem':
                    handleTweet(entry['content']['entryType'], entry['content']['itemContent']);
                    break;

                // handle tweet threads
                case 'TimelineTimelineModule':
                    let entry_array = entry['content']['items'];

                    //todo: we should probably delete all replies to a Twitter blue user
                    entry_array.forEach((item, index) => {
                        handleTweet(entry['content']['entryType'], item['item']['itemContent']);
                    });
                    break
            }
        });
    });

    return JSON.stringify(json);
}
