import { By, WebDriver } from 'selenium-webdriver'
import { random } from './util'

// Instagram updates these selectors from time to time, so they might need adapting
const FOLLOWING_SELECTOR =
  'div > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div > div > div.alzwoclg.cqf1kptm.p1t2w4gn.fawcizw8.om3e55n1.g4tp4svg > section > main > div > header > section > ul > li:nth-child(3) > a'
const FOLLOWING_NUM_SELECTOR =
  'div > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div > div > div.alzwoclg.cqf1kptm.p1t2w4gn.fawcizw8.om3e55n1.g4tp4svg > section > main > div > header > section > ul > li:nth-child(3) > a > div > span'
const FOLLOWING_NUM_SELECTOR_FALLBACK =
  'div > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div > div > div.alzwoclg.cqf1kptm.p1t2w4gn.fawcizw8.om3e55n1.g4tp4svg > section > main > div > header > section > ul > li:nth-child(3) > div > span'
const FOLLOWING_WINDOW_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div.th8rvtx1.f7rl1if4.adechonz.rufpak1n.qtovjlwq.qbmienfq.rfyhaz4c.rdmi1yqr.ohrdq8us.nswx41af.fawcizw8.l1aqi3e3.om3e55n1.sdu1flz4.dahkl6ri > div > div > div > div > div.f0dnt3l3.qrrecgo5.o69pmk6j.rt5af2x2.iriodytt.hw7435fk.ba4ynyj4.mm05nxu8.l2tm8nht > div > div > div._aano > div:nth-child(1) > div > div'
const FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div.th8rvtx1.f7rl1if4.adechonz.rufpak1n.qtovjlwq.qbmienfq.rfyhaz4c.rdmi1yqr.ohrdq8us.nswx41af.fawcizw8.l1aqi3e3.om3e55n1.sdu1flz4.dahkl6ri > div > div > div > div > div.f0dnt3l3.qrrecgo5.o69pmk6j.rt5af2x2.iriodytt.hw7435fk.ba4ynyj4.mm05nxu8.l2tm8nht > div > div > div._aano > div:nth-child(1) > div > div:last-child'
const FOLLOWING_WINDOW_FIRST_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.bdao358l.om3e55n1.g4tp4svg > div > div.th8rvtx1.f7rl1if4.adechonz.rufpak1n.qtovjlwq.qbmienfq.rfyhaz4c.rdmi1yqr.ohrdq8us.nswx41af.fawcizw8.l1aqi3e3.om3e55n1.sdu1flz4.dahkl6ri > div > div > div > div > div.f0dnt3l3.qrrecgo5.o69pmk6j.rt5af2x2.iriodytt.hw7435fk.ba4ynyj4.mm05nxu8.l2tm8nht > div > div > div._aano > div:nth-child(1)'

/**
 * Finds the interactive following button on the current profile
 * @param driver the WebDriver instance
 * @returns a WebElementPromise containing the following button
 */
export async function findFollowingButton(driver: WebDriver) {
  return await driver.findElement(By.css(FOLLOWING_SELECTOR))
}

/**
 * Gets the number of followings of the current profile (according to the label on the profile page)
 * @param driver the WebDriver instance
 * @returns the number of people followed by the current profile
 */
export async function getFollowingNumber(driver: WebDriver) {
  return parseInt(
    (
      await (
        await driver
          .findElement(By.css(FOLLOWING_NUM_SELECTOR))
          .catch((_) =>
            driver.findElement(By.css(FOLLOWING_NUM_SELECTOR_FALLBACK)),
          )
      ).getText()
    ).replaceAll(',', ''),
  )
}

/**
 * Finds all the accounts in the currently opened following window and returns them as a string array
 * @param driver the WebDriver instance
 * @returns an array of all usernames in the currently opened following window
 */
export async function findFollowingAccountsToString(driver: WebDriver) {
  const accountNames: string[] = []
  const accounts = await findFollowingAccounts(driver)
  for (const account of accounts) {
    accountNames.push((await account.getText()).split('\n')[0])
  }
  return accountNames
}

/**
 * Finds all the accounts in the currently opened following window
 * @param driver the WebDriver instance
 * @returns the WebElements of all the accounts in the following window
 */
export async function findFollowingAccounts(driver: WebDriver) {
  return await driver.findElements(By.css(FOLLOWING_WINDOW_FOLLOWING_SELECTOR))
}

/**
 * Scrolls the down the (already opened) following window until the last currently loaded account is visible
 *
 * Scrolling in SeleniumJS is not implemented yet, so we'll have to use a workaround.
 * @param {WebDriver} driver the WebDriver instance
 * @returns a Promise that resolves when the scroll is completed
 * @link https://www.selenium.dev/documentation/webdriver/actions_api/wheel/
 */
export async function scrollDownFollowList(driver: WebDriver): Promise<void> {
  return driver.executeScript(
    `document.querySelector('${FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR}').scrollIntoView(true)`,
    [],
  )
}

/**
 * Checks if Instagram is showing us a loading icon in the following list. Used to identify rate limiting.
 * @param driver the WebDriver instance
 * @returns true if the loading icon is visible, false otherwise
 */
export async function isLoading(driver: WebDriver) {
  const loading = await driver
    .findElement(By.css(FOLLOWING_WINDOW_FIRST_FOLLOWING_SELECTOR))
    .catch((_) => null)
  if (loading) {
    return (
      (await loading.getAttribute('data-visualcompletion')) === 'loading-state'
    )
  }
  return false
}

/**
 * Sleeps for a given amount of time and adds some randomness to it
 * @param driver the WebDriver instance
 * @param base the minimum amount of time to sleep (in milliseconds)
 * @param max the maximum amount of time to sleep (in milliseconds)
 * @returns a Promise that resolves when the sleep is over
 */
export async function sleep(driver: WebDriver, base: number, max?: number) {
  const upper = 1200
  if (!max) {
    return await driver.sleep(random(base, base + upper))
  }
  if (base > max) {
    throw new Error('base > max')
  }
  return await driver.sleep(random(base, max))
}
