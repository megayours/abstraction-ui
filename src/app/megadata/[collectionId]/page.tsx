'use client';

import { useParams } from 'next/navigation';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import MegaData from '../page';

export default function CollectionPage() {
  const { collectionId } = useParams();
  const { walletAddress } = useWeb3Auth();

  if (!walletAddress) {
    return null;
  }

  return <MegaData initialCollectionId={Number(collectionId)} />;
} 