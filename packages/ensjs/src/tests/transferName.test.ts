import { ethers } from 'ethers'
import { ENS } from '..'
import setup from './setup'

let ENSInstance: ENS
let revert: Awaited<ReturnType<typeof setup>>['revert']
let createSnapshot: Awaited<ReturnType<typeof setup>>['createSnapshot']
let provider: ethers.providers.JsonRpcProvider
let accounts: string[]

beforeAll(async () => {
  ;({ ENSInstance, revert, createSnapshot, provider } = await setup())
  accounts = await provider.listAccounts()
})

afterAll(async () => {
  await revert()
})

describe('transferName', () => {
  beforeEach(async () => {
    await revert()
  })
  it('should allow a transfer on the registrar', async () => {
    const tx = await ENSInstance.transferName(
      'parthtejpal.eth',
      accounts[1],
      'baseRegistrar',
      { addressOrIndex: 0 },
    )
    expect(tx).toBeTruthy()
    await tx.wait()
    const result = await ENSInstance.getOwner('parthtejpal.eth')
    expect(result?.registrant).toBe(accounts[1])
  })
  it('should allow a transfer on the namewrapper', async () => {
    const wrapNameTx = await ENSInstance.wrapName(
      'parthtejpal.eth',
      accounts[0],
    )
    await wrapNameTx.wait()
    const tx = await ENSInstance.transferName(
      'parthtejpal.eth',
      accounts[1],
      'nameWrapper',
      { addressOrIndex: 0 },
    )
    expect(tx).toBeTruthy()
    await tx.wait()
    const result = await ENSInstance.getOwner('parthtejpal.eth')
    expect(result?.owner).toBe(accounts[1])
  })
})
