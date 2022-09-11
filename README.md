# instagram-following-network

Inspired by [a Medium post](https://medium.com/@maximpiessen/how-i-visualised-my-instagram-network-and-what-i-learned-from-it-d7cc125ef297) by [Maxim Piessen](https://github.com/maximpiessen), I created this Instagram following network visualiziation project. This repository contains my own implementation of:

- **an Instagram [Selenium](https://selenium.dev) web scraper** (located in `/scraper`) which iterates through a list of users and stores their followed accounts in a JSON file.
- **a [D3.js](https://d3js.org/) visualization** (located in `/presentation`) which uses the data created by the scraper to visualize my Instagram network

![Application screenshot](/.github/screenshot.png)

This project was a lot of fun and I found out a lot of interesting facts about the connections between my circle of friends.

## Installation & How To Use

Of course it would be a lot cooler to have a website where you can just log in with Instagram and have the application visualize the network for you automatically. However, at the time of writing (September 2022), Instagram has not published any APIs to make something like this possible (and very probably never will)

That's why scraping the data from Instagram is a long and annoying process of repeatedly scraping, getting blocked by Instagram and scraping again over the course of several weeks (depending on how many people you follow on Instagram).

If you want to undergo the process and use this application yourself, here's how you do it.

### Big disclaimer

Before we start, a word of warning: *Instagram doesn't want you to do this* — I don't exactly know why, as it is not in any way a malicious activity to scrape following data in my opinion, but Instagram will (temporarily) block your account/IP from receiving following data once it detects automated behavior.

If you use this application, you use it AT YOUR OWN RISK. I am NOT RESPONSIBLE if you get permanently banned from Instagram or otherwise lose access to your account by using this application. I haven't had my own account banned by using this script and I doubt that it will happen to you, but it might very well be possible that Instagram changes this and starts actively locking accounts which show signs of automated behavior.

### Step 1: Clone and Install

Clone the repository and install `scraper` and `presentation`

```shell
git clone git@github.com:bemoty/instagram-following-network.git
cd instagram-following-network/scraper
yarn install
cd ../presentation
yarn install
```

### Step 2: Fix up querySelector strings

Instagram frequently changes querySelector strings with every front-end redeploy. This is why you have to make sure that the queryStrings at the top of `scraper/src/interact.ts` are up to date.

You can copy a querySelector string from DevTools by right-clicking the element in the Element tree and clicking `Copy -> Copy selector`

### Step 3: Install Chromium and/or Chromedriver

TODO

### Step 4: Scrape your own followings

TODO

### Step 5: Let the scraper do it's job, repeatedly

Now, simply run the scraper by opening a terminal in the `/scraper` directory and running `yarn start`.

A Chromium browser window will open and automatically navigate to the profiles scraped in step 2. The scraper will automatically shut down once it detects that Instagram has blocked you and exits.

You then have to re-run the the scraper on the next day (you're usually unblocked by then) and continue until the import file is empty.

### Step 6: Visualize

Run the visualization app in the `/presentation` directory by running `yarn dev` there. Open the app in your web browser and wait for it to load. (This can take a while, be patient!)

After that you're done. You've successfully visualized your Instagram network. 🎉

You can click through the network manually or tinker with the presentation code to filter specific connections. Nodes closer together (clusters) usually mean that there is a mutual connection (e. g. same high school class, members of your football club, etc.)

Nodes further away from the clicked node are usually the most interesting ones as they indicate that a person knows a person from a different cluster.

## License

This project is licensed under the terms of the [MIT License](https://choosealicense.com/licenses/mit/).


