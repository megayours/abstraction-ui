'use client';

import MegaData from '../page';

type PageProps = {
  params: Promise<{
    collectionId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CollectionPage({ params, searchParams }: PageProps) {
  return <MegaData params={params} searchParams={searchParams} />;
} 