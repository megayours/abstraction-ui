import { useEffect, useState } from 'react';
import { getRandomTokensByAttribute, Token } from '@/lib/api/megadata';
import { Skeleton } from '@/components/ui/skeleton';

export default function TokenGallery() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRandomTokensByAttribute('image', 9)
      .then((data) => {
        // Only keep tokens with a valid image string
        setTokens(
          data.filter(
            (token) => typeof token.data?.image === 'string' && token.data.image.length > 0
          )
        );
      })
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...others] = tokens;
  const shuffledOthers = others ? others.sort(() => 0.5 - Math.random()) : [];
  const displayTokens = shuffledOthers.slice(0, 12); // Show up to 12 others for a 4x3 grid

  const imageUri = (uri: string) => {
    console.log(uri);
    if (uri.startsWith('ipfs://')) {
      console.log(`https://ipfs.io/ipfs/${uri.slice(7)}`);
      return `https://ipfs.io/ipfs/${uri.slice(7)}`;
    }
    return uri;
  }

  // Hover effect classes
  const hoverEffect =
    'transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:ring-4 hover:ring-[#AAC4E7]/40 focus:outline-none focus:ring-4 focus:ring-[#AAC4E7]/60 cursor-pointer';
  const cardBase = 'shadow-xl bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl';
  const featuredGlow = 'relative before:content-[""] before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-[#AAC4E7]/40 before:to-[#E9D973]/30 before:blur-2xl before:opacity-70 before:-z-10';

  return (
    <section id="token-gallery" className="relative py-16 min-h-[80vh] flex flex-col items-center justify-center">
      <h2 className="text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-4">
        Current experiences
      </h2>
      <div className="mx-auto max-w-3xl py-4 px-4 lg:px-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="w-full">
            {loading || tokens.length < 6 ? (
              <div className="grid grid-cols-3 gap-6 h-[360px] max-w-[540px] mx-auto lg:grid-cols-4 lg:max-w-[900px]">
                <Skeleton className="rounded-3xl col-span-2 row-span-2 h-full w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="rounded-2xl h-full w-full" />
                ))}
              </div>
            ) : (
              <div
                className="grid grid-cols-3 gap-6 h-auto max-w-[540px] mx-auto lg:grid-cols-4 lg:max-w-[900px]"
              >
                {/* Featured (large) image with glow */}
                <a
                  href={`/megatokens/editor/${featured.collection_id}`}
                  tabIndex={0}
                  className={`col-span-2 row-span-2 overflow-hidden flex items-center justify-center group aspect-square ${cardBase} ${hoverEffect} ${featuredGlow} lg:col-span-2 lg:row-span-2`}
                  aria-label="View collection"
                  style={{ zIndex: 1 }}
                >
                  <img
                    src={imageUri(featured.data.image)}
                    alt="Art token"
                    className="w-full h-full object-contain rounded-3xl drop-shadow-xl"
                    style={{ display: 'block' }}
                  />
                </a>
                {/* Up to 12 small images for desktop, 5 for mobile */}
                {displayTokens.map((token, i) => (
                  <a
                    key={token.id}
                    href={`/megatokens/editor/${token.collection_id}`}
                    tabIndex={0}
                    className={`rounded-2xl overflow-hidden flex items-center justify-center group aspect-square ${cardBase} ${hoverEffect}`}
                    aria-label="View collection"
                  >
                    <img
                      src={imageUri(token.data.image)}
                      alt="Art token"
                      className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                      style={{ display: 'block' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 