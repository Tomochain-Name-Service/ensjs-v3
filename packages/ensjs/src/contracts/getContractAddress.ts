import { ContractName, SupportedNetworkId } from './types'

const addresses: Record<
  ContractName,
  Partial<Record<SupportedNetworkId, string>> | string
> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  BaseRegistrarImplementation: {
    '88': '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    '89': '0xce0537BD0F700d014Dca329eF75e344B35bff7e0',
  },
  DNSRegistrar: {
    '88': '0x58774Bb8acD458A640aF0B88238369A167546ef2',
    '89': '0x4618A534435f81936CabD630B8DA30A575F71e96',
  },
  ETHRegistrarController: {
    '88': '0x253553366Da8546fC250F225fe3d25d0C782303b',
    '89': '0xB56455Cdc9D962dd49284baabF1545F0E10FD3D6',
  },
  Multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  NameWrapper: {
    '88': '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401',
    '89': '0xc51131DF692Ea113aCe23a6F84F9DADfE725dB82',
  },
  PublicResolver: {
    '88': '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
    '89': '0x96a386bef3Ab62F8b166a3F2cdd352fD2a33FB51',
  },
  ENSRegistry: {
    '88': '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
    '89': '0xB377E85fe2233734b47C90e7403FAEFb40Ba9aE6',
  },
  ReverseRegistrar: {
    '88': '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb',
    '89': '0x2E52598E3d04Eb558983100eFFdDe889b660f7a3',
  },
  UniversalResolver: {
    '88': '0xc0497e381f536be9ce14b0dd3817cbcae57d2f62',
    '89': '0xBF3D8E093eC723684f5eF9C2eBB40424E1E1eE68',
  },
  BulkRenewal: {
    '88': '0xa12159e5131b1eEf6B4857EEE3e1954744b5033A',
    '89': '0x3Fa6302f3F4416d1B57572529a5928C682b74CA5',
  },
  /* eslint-enable @typescript-eslint/naming-convention */
}

export type ContractAddressFetch = (contractName: ContractName) => string

export const getContractAddress = (networkId: SupportedNetworkId) =>
  ((contractName: ContractName) => {
    try {
      return typeof addresses[contractName] === 'string'
        ? addresses[contractName]
        : addresses[contractName][networkId]
    } catch {
      throw new Error(
        `No address for contract ${contractName} on network ${networkId}`,
      )
    }
  }) as ContractAddressFetch
