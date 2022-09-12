import { By, WebDriver } from 'selenium-webdriver'
import { random } from './util'

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

export async function findFollowingButton(driver: WebDriver) {
  return await driver.findElement(By.css(FOLLOWING_SELECTOR))
}

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

export async function getFollowingAccounts(driver: WebDriver) {
  const accountNames: string[] = []
  const accounts = await driver.findElements(
    By.css(FOLLOWING_WINDOW_FOLLOWING_SELECTOR),
  )
  for (const account of accounts) {
    accountNames.push((await account.getText()).split('\n')[0])
  }
  return accountNames
}

export async function findFollowingAccounts(driver: WebDriver) {
  const accounts = await driver.findElements(
    By.css(FOLLOWING_WINDOW_FOLLOWING_SELECTOR),
  )
  console.log(`Found ${accounts.length} accounts`)
  return accounts
}

export async function scrollDownFollowList(driver: WebDriver) {
  // scrolling in selenium javascript is not implemented yet (bruh), so we'll have to
  // use a workaround (see https://www.selenium.dev/documentation/webdriver/actions_api/wheel/)
  return driver.executeScript(
    `document.querySelector('${FOLLOWING_WINDOW_LAST_FOLLOWING_SELECTOR}').scrollIntoView(true)`,
    [],
  )
}

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
