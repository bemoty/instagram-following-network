import { WebDriver } from 'selenium-webdriver'
import {
  findFollowingAccounts,
  findFollowingAccountsToString,
  findFollowingButton,
  getFollowingNumber,
  isLoading,
  scrollDownFollowList,
  sleep,
} from './interact'
import { writeExport, writeImport } from './io'
import { Export, FatalError, Import } from './models'
import { quit } from './util'

/**
 * Gets all following accounts for a username (navigates the browser there first)
 * @param driver the WebDriver instance
 * @param username the username whose followings are to be retrieved
 * @param index the index of the username in the import file, if applicable
 * @returns a string array of all usernames followed by the given username
 */
export async function getFollowings(
  driver: WebDriver,
  username: string,
  index?: number,
) {
  await driver.get(`https://instagram.com/${username}`)
  await sleep(driver, 3500, 4000) // instagram sometimes takes ages to load
  const following = await getFollowingNumber(driver).catch(async () => {
    if (index === 0) {
      // if the first entry fails, the selectors may be outdated
      return -2
    }
    return -1
  })
  switch (following) {
    case 0:
      return []
    case -1:
      throw new Error(
        `Could not retrieve following number for '${username}' - this can happen if the user is deleted, you are not logged in or the selectors are outdated`,
      )
    case -2:
      throw new FatalError(
        `Could not retrieve following number for '${username}' - your selectors may be outdated`,
        -1,
      )
  }
  console.log(`${username} is following ${following} people`)

  // Select the Instagram following button
  const followingButton = await findFollowingButton(driver).catch(async () => {
    return null
  })
  if (followingButton) {
    followingButton.click()
  } else {
    throw new FatalError(
      `Could not find following button. Please log in and restart the script. 
        If that doesn't work, Instagram might have changed the CSS selector (or the person removed you from their followers)`,
      -1,
    )
  }

  // Scroll down the following window, then retrieve all the followings
  let rateLimitedCache = {
    lastLength: -1,
    noChangeCounter: 0,
  }
  for (;;) {
    let accounts = await findFollowingAccounts(driver)
    console.log(`Found ${accounts.length} accounts`)
    if (accounts.length >= following) {
      console.log(`Received all followings for '${username}'`)
      break
    }
    if (accounts.length === rateLimitedCache.lastLength) {
      if (rateLimitedCache.noChangeCounter >= 5) {
        if (await isLoading(driver)) {
          throw new FatalError('Instagram blocked us, exiting.', 0)
        }
        console.log(
          `It seems all followings for '${username}' have been loaded (${
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
  return await findFollowingAccountsToString(driver)
}

/**
 * Takes all entries from the import file one by one and populates the export file with it
 * @param driver the WebDriver instance
 * @param importData the previously created and parsed import file
 * @param exportData the already created export data (may be empty)
 */
export async function populateExportData(
  driver: WebDriver,
  importData: Import[],
  exportData: Export[],
) {
  const importDataCopy = [...importData]
  for (let i = 0; i < importData.length; i++) {
    let user = importData[i]
    if (user.ignored) {
      console.log(`Skipping ignored user '${user.name}'`)
      await nextEntry(importDataCopy)
      continue
    }
    console.log(`Checking user '${user.name}'`)
    const followings = await getFollowings(driver, user.name, i).catch(
      async (err) => {
        console.error(err.message)
        if (err instanceof FatalError) {
          await quit(driver, err.exitCode)
        }
        await nextEntry(importDataCopy)
        return []
      },
    )
    if (followings.length === 0) {
      console.log(`Skipping user '${user.name}'`)
    } else {
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
  }
}

async function nextEntry(importData: Import[]) {
  importData.splice(0, 1)
  await writeImport(importData)
}
