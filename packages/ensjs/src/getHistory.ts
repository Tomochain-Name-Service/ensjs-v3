import { formatsByCoinType } from '@ensdomains/address-encoder'
import { ethers } from 'ethers'
import { ENSArgs } from '.'
import { decodeContenthash } from './utils/contentHash'
import { makeOtherIndexes } from './utils/makeHashIndexes'

type DomainEvent = 'NewOwner' | 'NewResolver' | 'Transfer' | 'NewTTL'
type RegistrationEvent = 'NameRegistered' | 'NameRenewed' | 'NameTransferred'
type ResolverEvent =
  | 'AddrChanged'
  | 'MulticoinAddrChanged'
  | 'NameChanged'
  | 'AbiChanged'
  | 'PubkeyChanged'
  | 'TextChanged'
  | 'ContenthashChanged'
  | 'InterfaceChanged'
  | 'AuthorisationChanged'

type EventTypes = 'Domain' | 'Registration' | 'Resolver'

const eventFormat: Record<
  EventTypes,
  Record<string, (args: any) => Record<string, any>>
> = {
  Domain: {
    NewOwner: (args: any) => ({ owner: args.owner.id }),
    NewResolver: (args: any) => ({ resolver: args.resolver.id.split('-')[0] }),
    Transfer: (args: any) => ({ owner: args.owner.id }),
    NewTTL: (args: any) => ({ ttl: args.ttl }),
  },
  Registration: {
    NameRegistered: (args: any) => ({
      registrant: args.registrant.id,
      expiryDate: args.expiryDate,
    }),
    NameRenewed: (args: any) => ({ expiryDate: args.expiryDate }),
    NameTransferred: (args: any) => ({ owner: args.newOwner.id }),
  },
  Resolver: {
    AddrChanged: (args: any) => ({ addr: args.addr.id }),
    MulticoinAddrChanged: (args: any) => {
      const format = formatsByCoinType[parseInt(args.coinType)]
      if (!format) {
        return {
          coinType: args.coinType,
          rawAddr: args.multiaddr,
        }
      }
      if (ethers.utils.hexStripZeros(args.multiaddr) === '0x') {
        return {
          coinType: args.coinType,
          coinName: format.name,
          rawAddr: '0x',
        }
      }
      return {
        coinType: args.coinType,
        coinName: format.name,
        addr: format.encoder(Buffer.from(args.multiaddr.slice(2), 'hex')),
      }
    },
    NameChanged: (args: any) => ({ name: args.name }),
    AbiChanged: (args: any) => ({ contentType: args.contentType }),
    PubkeyChanged: (args: any) => ({ x: args.x, y: args.y }),
    TextChanged: (args: any) => ({ key: args.key }),
    ContenthashChanged: (args: any) => ({ hash: decodeContenthash(args.hash) }),
    InterfaceChanged: (args: any) => ({
      interfaceId: args.interfaceId,
      implementer: args.implementer,
    }),
    AuthorisationChanged: (args: any) => ({
      owner: args.owner,
      target: args.target,
      isAuthorized: args.isAuthorized,
    }),
  },
}

const mapEvents = (eventArray: any[], type: EventTypes) =>
  eventArray.map((event: any) => ({
    type: event.__typename,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionID,
    id: event.id,
    data: eventFormat[type][event.__typename](event),
  }))

const mapResultDetailDecode =
  (publicResolver: ethers.Contract) => (result: any) => {
    const hashIndexes = makeOtherIndexes(result.input, '10f13a8c')
    const abiLengths = hashIndexes.map((x: number) => ({
      index: x,
      length:
        x === 0
          ? ethers.utils.hexDataLength(result.input)
          : parseInt(ethers.utils.hexDataSlice(result.input, x - 32, x), 16),
    }))
    const ABIs = abiLengths.map(({ index, length }) =>
      ethers.utils.hexDataSlice(result.input, index, index + length),
    )
    return ABIs.map((abi: string) => {
      try {
        return publicResolver.interface.decodeFunctionData(
          'setText(bytes32,string,string)',
          abi,
        )
      } catch {
        return null
      }
    })
  }

const expandDecode = (prev: any, curr: any) => {
  if (!curr) return [...prev, { value: null }]
  if (!curr.length) return [...prev, curr]
  return [...prev, ...curr]
}

export async function getHistory(
  { gqlInstance }: ENSArgs<'gqlInstance'>,
  name: string,
) {
  const client = gqlInstance.client
  const query = gqlInstance.gql`
      query getHistory($name: String!, $label: String!) {
        domains(where: { name: $name }) {
          events {
            id
            blockNumber
            transactionID
            __typename
            ...on Transfer {
              owner {
                id
              }
            }
            ...on NewOwner {
              owner {
                id
              }
            }
            ...on NewResolver {
              resolver {
                id
              }
            }
            ...on NewTTL {
              ttl
            }
          }
          owner {
            registrations (where: { labelName: $label }) {
              events {
                id
                blockNumber
                transactionID
                __typename
                ...on NameRegistered {
                  registrant {
                    id
                  }
                  expiryDate
                }
                ...on NameRenewed {
                  expiryDate
                }
                ...on NameTransferred {
                  newOwner {
                    id
                  }
                }
              }
            }
          }
          resolver {
            events {
              id
              blockNumber
              transactionID
              __typename
              ...on AddrChanged {
                addr {
                  id
                }
              }
              ...on MulticoinAddrChanged {
                coinType
                multiaddr: addr
              }
              ...on NameChanged {
                name
              }
              ...on AbiChanged {
                contentType
              }
              ...on PubkeyChanged {
                x
                y
              }
              ...on TextChanged {
                key
              }
              ...on ContenthashChanged {
                hash
              }
              ...on InterfaceChanged {
                interfaceID
                implementer
              }
              ...on AuthorisationChanged {
                owner
                target
                isAuthorized
              }
            }
          }
        }
      }
      `

  const label = name.split('.')[0]

  const { domains } = await client.request(query, { name, label })

  if (!domains || domains.length === 0) return null

  const [
    {
      events: domainEvents,
      owner: {
        registrations: [{ events: registrationEvents }],
      },
      resolver: { events: resolverEvents },
    },
  ] = domains

  const domainHistory = mapEvents(domainEvents, 'Domain')
  const registrationHistory = mapEvents(registrationEvents, 'Registration')
  let resolverHistory = mapEvents(
    // remove duplicate events for ETH cointype
    resolverEvents.filter(
      (event: any) => !event.coinType || event.coinType !== '60',
    ),
    'Resolver',
  )

  return {
    domain: domainHistory,
    registration: registrationHistory,
    resolver: resolverHistory,
  }
}

export async function getHistoryWithDetail(
  {
    contracts,
    gqlInstance,
    provider,
  }: ENSArgs<'contracts' | 'gqlInstance' | 'provider'>,
  name: string,
) {
  const historyRes = await getHistory({ gqlInstance }, name)

  if (!historyRes) return null

  const { domain, registration, resolver: resolverHistory } = historyRes

  const textEvents = resolverHistory.filter(
    (event) => event.type === 'TextChanged',
  )

  const transactions = textEvents.reduce((prev, curr) => {
    if (prev.includes(curr.transactionHash)) {
      return prev
    }
    return [...prev, curr.transactionHash]
  }, [] as string[])

  const publicResolver = await contracts?.getPublicResolver()!

  const fetchResult = (
    await ethers.utils.fetchJson(
      provider!.connection,
      JSON.stringify(
        transactions.map((tx, i) => ({
          jsonrpc: '2.0',
          id: i,
          method: 'eth_getTransactionByHash',
          params: [tx],
        })),
      ),
    )
  )
    .map((result: any) => result.result)
    .map(mapResultDetailDecode(publicResolver))
    .reduce(expandDecode, [])

  const detailedResolverHistory = resolverHistory.map((event) => {
    if (event.type !== 'TextChanged') return event
    const { id } = event
    const matchedTextInx = textEvents.findIndex((x) => x.id === id)
    return {
      ...event,
      data: {
        ...event.data,
        value: fetchResult[matchedTextInx] && fetchResult[matchedTextInx].value,
      },
    }
  })

  return {
    domain,
    registration,
    resolver: detailedResolverHistory,
  }
}

export async function getHistoryDetailForTransactionHash(
  { contracts, provider }: ENSArgs<'contracts' | 'provider'>,
  hash: string,
  indexInTransaction?: number,
) {
  const publicResolver = await contracts?.getPublicResolver()!
  const transaction = await provider!.getTransaction(hash)
  if (!transaction) return null
  const result = mapResultDetailDecode(publicResolver)({
    input: transaction.data,
  })
  if (!result || !result.length) return null
  if (typeof indexInTransaction === 'number') {
    if (indexInTransaction + 1 > result.length) return null
    const resultItem = result[indexInTransaction]
    if (
      !resultItem ||
      !resultItem.key ||
      (!resultItem.value && resultItem.value !== '')
    )
      return null
    return { key: resultItem.key, value: resultItem.value }
  }
  return result.map((item: any) => {
    if (!item.key) return null
    if (!item.value && item.value !== '') return { key: item.key, value: null }
    return { key: item.key, value: item.value }
  })
}
