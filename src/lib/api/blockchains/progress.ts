import { chains } from "./rpc"
import { Connection } from "@solana/web3.js"
import { ethers } from "ethers"

interface ChainProgress {
  chain: string
  currentUnit: number
  indexedUnit: number
  progress: number
  isBehind: boolean
}

const getEVMBlockHeight = async (rpcUrl: string): Promise<number> => {
  console.log("Getting EVM block height from", rpcUrl)
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const blockNumber = await provider.getBlockNumber()
  return blockNumber
}

const getSolanaBlockHeight = async (rpcUrl: string): Promise<number> => {
  console.log("Getting Solana block height from", rpcUrl)
  const connection = new Connection(rpcUrl)
  const blockHeight = await connection.getSlot();
  console.log("Solana block height:", blockHeight)
  return blockHeight;
}

const getChainBlockHeight = async (chain: string): Promise<number> => {
  const rpcUrls = chains[chain as keyof typeof chains]
  if (!rpcUrls) throw new Error(`No RPC URLs found for chain: ${chain}`)

  try {
    // Try each RPC URL until one works for both Solana and EVM chains
    for (const url of rpcUrls) {
      try {
        if (chain === "solana") {
          return await getSolanaBlockHeight(url)
        } else {
          return await getEVMBlockHeight(url)
        }
      } catch (error) {
        console.warn(`Failed to get block height from ${url}:`, error)
        continue
      }
    }
    throw new Error("All RPC URLs failed")
  } catch (error) {
    console.error(`Failed to get block height for chain ${chain}:`, error)
    throw error
  }
}

export const getIndexingProgress = async (chain: string, indexedUnit: number): Promise<ChainProgress> => {
  const currentUnit = await getChainBlockHeight(chain)
  const progress = (indexedUnit / currentUnit) * 100
  const isBehind = currentUnit - indexedUnit > 100 // Consider it behind if more than 100 blocks behind

  return {
    chain,
    currentUnit,
    indexedUnit,
    progress,
    isBehind
  }
}