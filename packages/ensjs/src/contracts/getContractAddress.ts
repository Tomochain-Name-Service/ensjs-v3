import { ContractName, SupportedNetworkId } from './types'

const addresses: Record<
  ContractName,
  Partial<Record<SupportedNetworkId, string>> | string
> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  BaseRegistrarImplementation: {
    // '88': '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    '89': '0x6e2A935017845bD7843775Dc2F751C4152ecFA01',
  },
  DNSRegistrar: {
    // '88': '0x58774Bb8acD458A640aF0B88238369A167546ef2',
    '89': '0x9928efa2321F429DDC97616d32f4D75Eb2A1B421',
  },
  ETHRegistrarController: {
    // '88': '0x253553366Da8546fC250F225fe3d25d0C782303b',
    '89': '0x4e6A64B8f5E96Cf7181c16fBC97889e6DCA70602',
  },
  Multicall: {
    '89': '0xcaeccB62967562A3dA17a0860b06588180C5312E',
  },
  NameWrapper: {
    // '88': '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401',
    '89': '0x3e8d59bc779c1f67559B674Ff66122cb3e724E51',
  },
  PublicResolver: {
    // '88': '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
    '89': '0x48f5Cb69812A5Bb6132256A2DFb7294F1fc5dACF',
  },
  ENSRegistry: {
    // '88': '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
    '89': '0x05b8f78424AaB5876Bdb673896eE2C31f3b10BB9',
  },
  ReverseRegistrar: {
    // '88': '0xB82233489618E1A310CB6893cbF0e7a418fCD1B3',
    '89': '0xB82233489618E1A310CB6893cbF0e7a418fCD1B3',
  },
  UniversalResolver: {
    // '88': '0xc0497e381f536be9ce14b0dd3817cbcae57d2f62',
    '89': '0xFbD6C32c9A8D3a63F78c7b34c1fae29Fc87ecD62',
  },
  BulkRenewal: {
    // '88': '0xa12159e5131b1eEf6B4857EEE3e1954744b5033A',
    '89': '0xc660F701De61016D233Fb55B3C56249f3f482A46',
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
