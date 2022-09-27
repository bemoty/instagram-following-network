export interface Export {
  name: string
  followings: string[]
}

export interface Import {
  name: string
  ignored: boolean
}

export class FatalError extends Error {
  constructor(message: string, public exitCode: number) {
    super(message)
  }
}
