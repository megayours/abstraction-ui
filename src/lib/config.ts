export const config = {
  abstractionChain: {
    directoryNodeUrlPool: process.env.NEXT_PUBLIC_DIRECTORY_NODE_URL_POOL?.split(','),
    blockchainRid: process.env.NEXT_PUBLIC_BLOCKCHAIN_RID,
  },
  megaRouterUri: process.env.NEXT_PUBLIC_MEGAROUTER_URI,
  megaForwarderUri: process.env.NEXT_PUBLIC_MEGAFORWARDER_URI,
  megadataApiUri: process.env.NEXT_PUBLIC_MEGADATA_API_URI,
}