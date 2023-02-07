import { argv } from 'process'
import { Builder, WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { createImportBackup, readExport, readImport, writeImport } from './io'
import { getFollowings, populateExportData } from './main'
import { FatalError } from './models'
import { quit } from './util'

async function main(args: string[]) {
  const options = new chrome.Options()
  options.addArguments('--user-data-dir=selenium')
  const driver = await new Builder()
    .setChromeOptions(options)
    .forBrowser('chrome')
    .build()
  await driver.manage().setTimeouts({ implicit: 500 })

  if (args.length === 0) {
    await processImportFile(driver)
    await quit(driver)
  } else if (args.length === 2) {
    const command = args[0]
    const arg = args[1]
    if (command === 'create') {
      let imported = await createImportFile(driver, arg)
      if (imported.length !== 0) {
        // Import successful, don't need browser anymore
        await quit(driver)
      }
    } else {
      console.error('Unknown command')
      await quit(driver, -1)
    }
  } else {
    console.error('Invalid arguments')
    await quit(driver, -1)
  }
  console.log("We're done here...")
}

async function processImportFile(driver: WebDriver) {
  console.log('Reading import file...')
  const importData = await readImport().catch((err) => {
    console.error('Cannot read import data, exiting', err)
    quit(driver, -1)
    return []
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
    quit(driver, -1)
  })
  await populateExportData(driver, importData, exportData)
}

async function createImportFile(driver: WebDriver, username: string) {
  console.log('Creating import file...')
  const followings = await getFollowings(driver, username).catch(
    async (err) => {
      console.error(err)
      if (err instanceof FatalError) {
        await quit(driver, err.exitCode)
      }
      return []
    },
  )
  // TODO: Create ignore list for populating ignored boolean
  await writeImport(followings.map((name) => ({ name, ignored: false })))
  return followings
}

main(argv.slice(2))
