import { exit } from 'process'
import { Builder, WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import {
  findFollowingAccounts,
  findFollowingButton,
  getFollowingAccounts,
  getFollowingNumber,
  scrollDownFollowList,
  sleep,
} from './interact'
import {
  createImportBackup,
  readExport,
  readImport,
  writeExport,
  writeImport,
} from './io'
import { Export, Import } from './models'

async function main() {
  const importData = await readImport().catch((err) => {
    console.error('Cannot read import data, exiting', err)
    exit(-1)
  })
  const exportData = await readExport().catch((err) => {
    console.error(
      'Export data does not exist or is invalid, starting from scratch',
      err,
    )
    return []
  })

  await createImportBackup(importData).catch((err) => {
    console.error('Cannot create import backup, exiting', err)
    exit(-1)
  })

  const options = new chrome.Options()
  options.addArguments('--user-data-dir=selenium')
  const driver = await new Builder()
    .setChromeOptions(options)
    .forBrowser('chrome')
    .build()
  await driver.manage().setTimeouts({ implicit: 500 })
  navigate(driver, importData, exportData)
}

async function navigate(
  driver: WebDriver,
  importData: Import[],
  exportData: Export[],
) {
  const importDataCopy = [...importData]
  for (let i = 0; i < importData.length; i++) {
    let user = importData[i]
    if (user.famous) {
      // we ignore verified users, its usually not interesting who they follow
      console.log(`Skipping verified user '${user.name}'`)
      await nextEntry(importDataCopy)
      continue
    }
    console.log(`Checking user '${user.name}'`)
    await driver.get(`https://instagram.com/${user.name}`)
    await sleep(driver, 3500, 4000) // instagram sometimes takes ages to load

    const following = await getFollowingNumber(driver).catch(async () => {
      if (i === 0) {
        // if the first entry fails, the selectors may be outdated
        console.error(
          `Could not retrieve following numer for '${user.name}'. Exiting as it was the first attempt (try updating the selectors)`,
        )
        await quit(driver, -1)
      }
      console.log(
        `Could not retrieve following numer for '${user.name}'. Skipping. (Deleted user?)`,
      )
      return 0
    })
    if (following === 0) {
      console.log(`${user.name} has no following, skipping`)
      await nextEntry(importDataCopy)
      continue
    }
    console.log(`${user.name} is following ${following} people`)

    // Select the Instagram following button
    const followingButton = await findFollowingButton(driver).catch(
      async () => {
        return null
      },
    )
    if (followingButton) {
      followingButton.click()
    } else {
      console.log(
        'Could not find following button. Please log in and restart the script.',
      )
      console.log(
        "If that doesn't work, Instagram might have changed the CSS selector (or the person removed you from their followers)",
      )
      await quit(driver)
    }

    // scroll down the following window, then retrieve all the followings
    let rateLimitedCache = {
      lastLength: -1,
      noChangeCounter: 0,
    }
    let rateLimited = false
    for (;;) {
      let accounts = await findFollowingAccounts(driver)
      if (accounts.length >= following) {
        console.log(`Received all followings for '${user.name}'. Moving on.`)
        break
      }
      if (accounts.length === rateLimitedCache.lastLength) {
        // TODO: Add rate limited check (loading icon)
        if (rateLimitedCache.noChangeCounter >= 5) {
          console.log(
            `It seems all followings for '${
              user.name
            }' have been loaded. Moving on. (${
              following - accounts.length
            } missed)`,
          )
          break
        }
        console.log(
          `Following counter didn't change, iteration ${
            rateLimitedCache.noChangeCounter + 1
          }`,
        )
        rateLimitedCache.noChangeCounter++
      } else {
        rateLimitedCache.lastLength = accounts.length
        rateLimitedCache.noChangeCounter = 0
      }
      await sleep(driver, 2000, 2500)
      await scrollDownFollowList(driver)
      await sleep(driver, 2000, 3000)
    }

    if (rateLimited) {
      // we are rate limited, let's quit
      // await quit(driver, 0)
      exit(0)
      return
    }

    const followings = await getFollowingAccounts(driver)
    console.log(`Storing ${followings.length} followings for '${user.name}'`)
    exportData.push({
      name: user.name,
      followings,
    })
    await writeExport(exportData)

    // update data so we don't check the user again
    await nextEntry(importDataCopy)

    // wait some extra time before moving on, maybe this will get us rate limited later
    await sleep(driver, 7000, 15000)
  }
  console.log("We're done here...")
  await quit(driver)
}

async function nextEntry(importData: Import[]) {
  importData.splice(0, 1)
  await writeImport(importData)
}

async function quit(driver: WebDriver, exitCode?: number) {
  await driver.quit()
  exit(exitCode ?? 0)
}

main()
