'use client';

import { useParams } from 'next/navigation';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import MegaData from '../page';

type PageProps = {
  params: Promise<{
    collectionId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CollectionPage({ params, searchParams }: PageProps) {
  const { walletAddress } = useWeb3Auth();

  if (!walletAddress) {
    return null;
  }

  return <MegaData params={params} searchParams={searchParams} />;
} 