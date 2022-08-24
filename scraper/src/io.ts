import fs from 'fs'
import { Export, Import } from './models'

const EXPORT_FILE = './data/export.json'
const IMPORT_BACKUP_FILE = './data/import.original.json'
const IMPORT_FILE = './data/import.json'

async function readJSON(file: string) {
  return JSON.parse(await fs.promises.readFile(file, { encoding: 'utf-8' }))
}

function writeJSON(file: string, data: any) {
  return fs.promises.writeFile(file, JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

export async function readExport(): Promise<Export[]> {
  return (await readJSON(EXPORT_FILE)) as Export[]
}

export function writeExport(data: Export[]) {
  return writeJSON(EXPORT_FILE, data)
}

export async function readImport() {
  return (await readJSON(IMPORT_FILE)) as Import[]
}

export function writeImport(data: Import[]) {
  return writeJSON(IMPORT_FILE, data)
}

function doesBackupExist(): Promise<boolean> {
  return new Promise((resolve, _) =>
    fs.access(IMPORT_BACKUP_FILE, fs.constants.F_OK, (err) => resolve(!err)),
  )
}

export async function createImportBackup(data: Import[]): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (await doesBackupExist()) {
      return resolve()
    }
    fs.writeFile(
      IMPORT_BACKUP_FILE,
      JSON.stringify(data),
      { encoding: 'utf-8' },
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      },
    )
  })
}
