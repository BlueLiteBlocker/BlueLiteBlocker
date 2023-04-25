# ![Logo](BlueLiteFilter/icons/logo-48.png) BlueLiteBlocker 

### Hide tweets from Twitter Blue users you don't follow without needing to mute or block them.
### Customizable to allow tweets from checks  with more than a set number of followers.
### Currently Supports: FireFox, Chrome

![Soft Filter Example](/example_screenshot.png)


### Install Instructions
Chrome: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked

FireFox: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

### How It Works
The extension intercepts HTTP responses from Twitter's API and parses the tweet lists for Twitter Blue users. 

Developing this extension required reverse engineering the Twitter API and client, 
so it may stop working if major changes to the platform are made. Please submit an issue to let me know about any bugs/suggestions.
-- -
### Settings
**Note**: this extension will not hide tweets from people you follow regardless of Blue status.

**Follow Threshold** - don't hide Tweets from users with more than X followers (default 100,000).

#### Filtering Modes

**Default** - Tweets from Twitter Blue users will be collapsed in the timeline/replies as seen in the image below. 

Note: this does not work for search/notification, so in those cases the extension will just remove the tweet.

![Soft Filter Example](screenshot_softblock.png)

**Hard** - Tweets from Twitter Blue users will never show up in your feed. This is somewhat buggy and needs further
testing.

-- -
### Known Issues
#### Hard Filter Mode
- may hit Twitter rate limit if lots of responses are from Blue users (seems like an API limitation, but may be fixable)
- some issues with feed moving after loading new tweets, may be due to Twitter expecting more Tweets than we show
- 

#### Soft Filter Mode
- no apparent way so collapse Tweets in notifications or search. We currently use hard filtering on these.


## Updates

Follow me on https://infosec.exchange/@malwaretech for updates.
 