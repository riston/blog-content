+++
date = "2017-07-05T23:30:32+03:00"
draft = false
title = "Data scraping with headless Chrome"
description = "Show how to use Chrome's headless mode for scrape"
tags = [ "Headless", "Chrome", "CDP" ]
thumbnail = "images/headless-chrome-scrape/chrome-canary-logo.png"
+++

With the recent years, the JavaScript language adoption has skyrocketed and it's hard to find web pages which are not using a single line of JavaScript. Many sites have converted from the traditional model of server side rendered pages to [Single Page Applications](https://en.wikipedia.org/wiki/Single-page_application) *(SPA)*. Which means that traditional web data mining, scrapers tools do not work with the SPA applications or do not give the expected results due to the dynamic nature.

To test how many web pages are still usable after JavaScript has turned off your browser JavaScript execution(somewhere in browser settings). Not many? Example [Twitter](https://twitter.com) redirects you to the mobile version when you have disabled JavaScript. Just for a note if you try to scrape Twitter, there is a [Public API](https://dev.twitter.com/rest/public) and if possible use that option instead of creating your own HTML scraper. Otherwise, if there is no API available and HTML isn't scrapable consider using semi/headless browsers Firefox(Xvfb), Phantom.js(No longer [maintained](https://groups.google.com/forum/#!topic/phantomjs/9aI5d-LDuNE)), new player Google Chrome's headless mode. In this blog post, we continue exploring options of Google Chome.

The concept of driving the command execution in Chrome headless is a bit different and it's done through the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) *(CDP)*. The protocol uses HTTP/WebSocket communication. First, you have to spawn the browser process with debugging port open. The commands/actions are defined in the script which connects to the browser and executes commands through CDP. If taking a screenshot, converting the site to PDF or getting site DOM dump is all you want to do there are shorter [commands](https://developers.google.com/web/updates/2017/04/headless-chrome) for this for these actions, example taking screenshot: `chrome --headless --disable-gpu --screenshot https://www.chromestatus.com/`

To get a better understanding how this works, let's walk through a simple example. Let's say we would want to scrape all the subredit [r/programming](https://www.reddit.com/r/programming) links. To simplify the interaction with Chrome we use node module which defines the chrome remote interface API for us [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface). It even has REPL for some quick testing and debugging.

{{< highlight javascript >}}
const CDP = require("chrome-remote-interface");

async function scrape(client) {
    const { DOM } = client;

    // Get document root element nodeId
    const rootElement = await DOM.getDocument();
    const { root: { nodeId } } = rootElement;

    // Use seletor to get the links
    const { nodeIds: linkIDs } = await DOM.querySelectorAll({
        selector: ".content a.title",
        nodeId,
    });

    // Get each element attributes
    const attributes = await Promise.all(linkIDs.map((ID) =>
        DOM.getAttributes({ nodeId: ID })
    ));

    // Atrributes are returned in single array and item pairs
    // [..., "href", "www.example.com"]
    const links = attributes
        .map(x => x.attributes)
        .filter(x => x.includes("href"))
        .map((attrs) => {
            const index = attrs.indexOf("href");
            return attrs[index + 1];
        });

    // Use set to get unique items only
    const uniqueLinks = new Set([...links]);

    return uniqueLinks;
}

async function onClientHandler(client) {
    // Extract domains
    const { Network, Page, Runtime, Overlay } = client;

    Page.loadEventFired(() => {
        console.log("Load event fired");
        scrape(client)
            .then((links) => {
                console.log(links);
                client.close();
            });
    });

    try {
        await Promise.all([ Network.enable(), Page.enable() ]);
        await Page.navigate({ url: "https://reddit.com/r/programming" });
    } catch (err) {
        console.error(err);
        client.close();
    }
};

CDP(onClientHandler)
.on("error", (err) => {
    console.error(err);
});
{{< /highlight >}}

Start the headless Chrome:
```chrome --headless --disable-gpu --remote-debugging-port=9222 --window-size=1280x1696```

Run the Node.js script after Chrome is already running: ```node reddit.js```

Scraping with a headless browser isn't that fast and memory/CPU efficient as downloading site's HTML and parsing the DOM. Before scraping make sure to analyse site and choose the best scraping technique.
