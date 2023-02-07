import { By, WebDriver } from 'selenium-webdriver'
import { random } from './util'

// Instagram updates these selectors from time to time, so they might need adapting (right click in DevTools -> Copy -> Copy selector)
// Tip: You can verify if the selectors are correct by running `document.querySelector('<SELECTOR>')` in DevTools. If the result is null, it's invalid

// This is the link of the "x following" text (https://i.bemoty.dev/6rZdc9)
const FOLLOWING_SELECTOR =
  'div > div > div > div.x78zum5.xdt5ytf.x10cihs4.x1t2pt76.x1n2onr6.x1ja2u2z > div.x9f619.xnz67gz.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.xh8yej3.x1gryazu.x10o80wk.x14k21rp.x1porb0y.x17snn68.x6osk4m > section > main > div > header > section > ul > li:nth-child(3) > a'
// This is the span that contains the following number (inside of the link above) (https://i.bemoty.dev/4LnH7y)
const FOLLOWING_NUM_SELECTOR =
  'div > div > div > div.x78zum5.xdt5ytf.x10cihs4.x1t2pt76.x1n2onr6.x1ja2u2z > div.x9f619.xnz67gz.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.xh8yej3.x1gryazu.x10o80wk.x14k21rp.x1porb0y.x17snn68.x6osk4m > section > main > div > header > section > ul > li:nth-child(3) > a > div > span > span'
// This is the link of the "x followers" text, when it isn't a link. This is needed for when you are not logged in. You may need to visit your profile in an incognito tab to get the correct selector here
const FOLLOWING_NUM_SELECTOR_FALLBACK =
  'div > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div > div.x78zum5.xdt5ytf.x10cihs4.x1t2pt76.x1n2onr6.x1ja2u2z > section > main > div > header > section > ul > li:nth-child(3) > button > div > span > span'
// In the following window (after clicking the following link) this selects the divs in the div that contains all of the loaded followings (https://i.bemoty.dev/7G26Lx; add > div to this selector)
const FOLLOWING_WINDOW_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div.x7r02ix.xf1ldfh.x131esax.xdajt7p.xxfnqb6.xb88tzc.xw2csxc.x1odjw0f.x5fp0pe > div > div > div._aano > div:nth-child(1) > div > div'
// same as above, but with a :last-child selector
const FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div.x7r02ix.xf1ldfh.x131esax.xdajt7p.xxfnqb6.xb88tzc.xw2csxc.x1odjw0f.x5fp0pe > div > div > div._aano > div:nth-child(1) > div > div:last-child'
// same as above, but with a :nth-child(1) selector
const FOLLOWING_WINDOW_FIRST_FOLLOWING_SELECTOR =
  'div > div > div > div:nth-child(4) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div > div > div > div > div.x7r02ix.xf1ldfh.x131esax.xdajt7p.xxfnqb6.xb88tzc.xw2csxc.x1odjw0f.x5fp0pe > div > div > div._aano > div:nth-child(1) > div > div:nth-child(1)'

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
