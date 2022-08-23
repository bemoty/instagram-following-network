const { By, Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const fs = require('fs')
const { exit } = require('process')

const FOLLOWING_SELECTOR =
  'div > div > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div > div > div.alzwoclg.cqf1kptm.p1t2w4gn.fawcizw8.om3e55n1.g4tp4svg > div:nth-child(1) > section > main > div > header > section > ul > li:nth-child(3) > a'
const FOLLOWING_NUM_SELECTOR =
  'div > div > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div > div > div.alzwoclg.cqf1kptm.p1t2w4gn.fawcizw8.om3e55n1.g4tp4svg > div:nth-child(1) > section > main > div > header > section > ul > li:nth-child(3) > a span'
const FOLLOWING_WINDOW_FOLLOWING_SELECTOR =
  'div > div > div > div > div:nth-child(4) > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div.th8rvtx1.f7rl1if4.adechonz.rufpak1n.qtovjlwq.qbmienfq.rfyhaz4c.rdmi1yqr.ohrdq8us.nswx41af.fawcizw8.l1aqi3e3.om3e55n1.sdu1flz4.dahkl6ri > div > div > div > div > div.f0dnt3l3.qrrecgo5.o69pmk6j.rt5af2x2.iriodytt.hw7435fk.ba4ynyj4.mm05nxu8.l2tm8nht > div > div > div._aano > div:nth-child(1) > div > div'
const FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR =
  'div > div > div > div > div:nth-child(4) > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div.th8rvtx1.f7rl1if4.adechonz.rufpak1n.qtovjlwq.qbmienfq.rfyhaz4c.rdmi1yqr.ohrdq8us.nswx41af.fawcizw8.l1aqi3e3.om3e55n1.sdu1flz4.dahkl6ri > div > div > div > div > div.f0dnt3l3.qrrecgo5.o69pmk6j.rt5af2x2.iriodytt.hw7435fk.ba4ynyj4.mm05nxu8.l2tm8nht > div > div > div._aano > div:nth-child(1) > div > div:last-child'

async function main() {
  let options = new chrome.Options()
  options.addArguments('--user-data-dir=selenium')
  driver = await new Builder()
    .setChromeOptions(options)
    .forBrowser('chrome')
    .build()
  fs.readFile('./data.json', { encoding: 'utf-8' }, (err, buffer) => {
    if (err) {
      console.error(err)
      return
    }
    try {
      const data = JSON.parse(buffer)
      navigate(driver, data)
    } catch (err) {
      console.error(err)
    }
    fs.access('./data.original.json', fs.constants.F_OK, (err) => {
      if (err) {
        // Create a backup version of the data as it will be overwritten later
        console.log('Creating backup...')
        fs.writeFile(
          './data.original.json',
          buffer,
          { encoding: 'utf-8' },
          (err) => {
            if (err) {
              console.error(
                'Cannot create backup! Exiting to avoid data loss',
                err,
              )
              exit(-1)
            }
          },
        )
      }
    })
  })
}

/** @param {ThenableWebDriver} driver */
async function navigate(driver, data) {
  await driver.manage().setTimeouts({ implicit: 500 })

  // Retrieve the exported data (from a previous run?)
  const exportData = await getExportData()

  // Here follows the main loop, might add some delays here to avoid getting rate limited
  const dataCopy = JSON.parse(JSON.stringify(data))
  for (let i = 0; i < data.length; i++) {
    let user = data[i]
    if (user.famous) {
      // we ignore verified users, its usually not interesting who they follow
      console.log(`Skipping verified user '${user.name}'`)
      dataCopy.splice(0, 1)
      await updateData(dataCopy)
      continue
    }
    console.log(`Checking user '${user.name}'`)
    await driver.get(`https://instagram.com/${user.name}`)
    await sleep(driver, 3500, 4000) // instagram sometimes takes ages to load

    // Select the Instagram following button
    var followingButton
    try {
      followingButton = await driver.findElement(By.css(FOLLOWING_SELECTOR))
      followingButton.click()
    } catch (err) {
      console.log(
        'Could not find following button. Please log in and restart the script.',
      )
      console.log(
        "If that doesn't work, Instagram might have changed the CSS selector",
      )
      driver.quit()
      exit(0)
    }
    const following = parseInt(
      (
        await (
          await driver.findElement(By.css(FOLLOWING_NUM_SELECTOR))
        ).getText()
      ).replaceAll(',', ''),
    )
    console.log(`${user.name} is following ${following} people`)

    // scroll down the following window, then retrieve all the followings
    let rateLimitedCache = {
      lastLength: 0,
      noChangeCounter: 0,
    }
    for (;;) {
      let accounts = await findFollowingAccounts(driver)
      // sometimes, the following count is off by one or two, dunno why, it's insta being weird
      if (accounts.length >= following - 2) {
        break
      }

      if (accounts.length === rateLimitedCache.lastLength) {
        if (rateLimitedCache.noChangeCounter >= 10) {
          console.log(
            'We are definitely rate limited, waiting for some time, then reloading...',
          )
          rateLimitedCache = {
            lastLength: 0,
            noChangeCounter: 0,
          }
          await sleep(driver, 30000)
          await driver.navigate().refresh()
          await sleep(driver, 10000) // wait some extra for the follow window to appear
          // we don't have to click the following button here because the url /following opens it automatically
          continue
        }
        console.log(
          `We might be rate limited, iteration ${
            rateLimitedCache.noChangeCounter + 1
          }`,
        )
        rateLimitedCache.noChangeCounter++
      } else {
        rateLimitedCache.lastLength = accounts.length
        rateLimitedCache.noChangeCounter = 0
      }

      await sleep(driver, 2000, 2500)
      // scrolling in selenium javascript is not implemented yet (bruh), so we'll have to
      // use a workaround (see https://www.selenium.dev/documentation/webdriver/actions_api/wheel/)
      await driver.executeScript(
        `document.querySelector('${FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR}').scrollIntoView(true)`,
        [],
      )
      await sleep(driver, 2000, 3000)
    }
    const followings = await getFollowingAccounts(driver)
    console.log(`Storing ${followings.length} followings for ${user.name}`)

    // we received all the followings, let's store them in the export file
    exportData.push({
      name: user.name,
      followings,
    })
    await writeExportFile(exportData)

    // update data so we don't check the user again
    dataCopy.splice(0, 1)
    await updateData(dataCopy)

    // wait some extra time before moving on, maybe this will get us rate limited later
    await sleep(driver, 7000, 15000)
  }
  console.log("We're done here...")
}

async function getExportData() {
  return new Promise((resolve, _) => {
    fs.readFile('./export.json', { encoding: 'utf-8' }, (err, buffer) => {
      if (err) {
        console.log('Export does not exist, creating empty file')
        resolve([])
        return
      }
      try {
        const data = JSON.parse(buffer)
        console.log(`Found ${data.length} users in export file`)
        resolve(data)
      } catch (err) {
        console.error('Tried to load invalid export data, ignoring it')
        resolve([])
      }
    })
  })
}


/** @param {ThenableWebDriver} driver */
async function sleep(driver, base, max) {
  const upper = 1200
  if (!max) {
    return await driver.sleep(random(base, base + upper))
  }
  if (base > max) {
    throw new Error('base > max')
  }
  return await driver.sleep(random(base, max))
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** @param {ThenableWebDriver} driver */
async function getFollowingAccounts(driver) {
  let accountNames = []
  let accounts = await driver.findElements(
    By.css(FOLLOWING_WINDOW_FOLLOWING_SELECTOR),
  )
  for (let account of accounts) {
    accountNames.push((await account.getText()).split('\n')[0])
  }
  return accountNames
}

/** @param {ThenableWebDriver} driver */
async function findFollowingAccounts(driver) {
  let accounts = await driver.findElements(
    By.css(FOLLOWING_WINDOW_FOLLOWING_SELECTOR),
  )
  console.log(`Found ${accounts.length} accounts`)
  return accounts
}

async function writeExportFile(data) {
  console.log('Updating export file...')
  fs.writeFileSync('./export.json', JSON.stringify(data), { encoding: 'utf-8' })
}

async function updateData(data) {
  console.log('Updating data...')
  fs.writeFileSync('./data.json', JSON.stringify(data), { encoding: 'utf-8' })
}

main()
