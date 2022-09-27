import { WebDriver } from 'selenium-webdriver'

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function quit(driver: WebDriver, exitCode?: number) {
  await driver.quit()
  process.exit(exitCode ?? 0)
}
