+++
date = "2017-10-26T15:00:41+03:00"
draft = false
title = "Data scraping with headless Chrome Puppeteer"
description = "Using higher level scraping library called Puppeteer"
tags = [ "Chrome", "Headless", "Lambda", "Heroku" ]
thumbnail = "images/puppeteer-chrome/logo.png"
+++

Great news from Google, there is now an official Google Chrome Headless library called [Puppeteer](https://github.com/GoogleChrome/puppeteer). In the first Chrome headless blog post, we used the CDP interface library which is quite a low-level interaction for Chrome. In this post, we go through some of the cons and pros of using Puppeteer.


Puppeteer allows a higher level to control the headless Chrome, it has better and easier to understand API. By installing Puppeteer package you also download separate Chrome instance(~71Mb Mac, ~90Mb Linux, ~110Mb Win. To skip the download, see environment variables). In last blog post we did assume that the Chrome instance has been already launched before executing the script, Puppeteer handles the launching and downloading part for you. Here is a small example to launch the browser instance:

{{< highlight javascript >}}
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  await browser.close();
})();
{{< /highlight >}}

The provided API is really simple it is suitable for some higher level UI integration test, automation, browser-side rendering etc. Let's rewrite the previous blog post Reddit scraper with Puppeteer.

{{< highlight javascript >}}
const puppeteer = require("puppeteer");

const url = "https://reddit.com/r/programming";
const linkSelector = ".content a.title";

(async () => {
    // Launch chrome process
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "load" });

    // This runs the `document.querySelectorAll` within the page and passes
    // the result to function
    const links = await page.$$eval(linkSelector, links => {
        return links.map((link) => link.href);
    });

    // Make sure we get the unique set of links only
    const uniqueLinks = new Set([...links]);
    console.log(uniqueLinks);

    // Kill the browser process
    await browser.close();
})();
{{< /highlight >}}

Your next question might be how to run Puppeteer in the AWS Lambda and in Heroku?

Using Puppeteer with AWS Lambda might be tricky because Chrome must be packaged with the dependencies. AWS Lambda has set the limit on the zip file to 50MB and unpackaged content should remain in a 250MB [limit](http://docs.aws.amazon.com/lambda/latest/dg/limits.html). The default Puppeteer Chrome Linux version would not fit into this limit which means you have to use a custom build. Some active community members have already created [starter kit for AWS Lambda](https://github.com/sambaiz/puppeteer-lambda-starter-kit). Besides, that be aware that AWS Lambda uses Node.js v6.1.0 version and there is no support for the await/async feature. Before deploy make sure you're using correct Node engine version or transpile the code to v6.10.

For Heroku, you have to add additional [build back](https://github.com/jontewks/puppeteer-heroku-buildpack) which installs the missing dependencies.

Puppeteer is an amazing initiative by Google developers hopefully, this project stays up to date and gets also the additional development from the community side.