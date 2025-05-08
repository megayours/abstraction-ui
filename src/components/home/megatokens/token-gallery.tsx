import { useEffect, useState, ReactNode } from 'react';
import { getRandomTokensByAttribute, Token } from '@/lib/api/megadata';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenGalleryProps {
  onTokenSelect?: (token: Token) => void;
  selectedToken?: Token | null;
  instructionBanner?: ReactNode;
}

export default function TokenGallery({ onTokenSelect, selectedToken, instructionBanner }: TokenGalleryProps) {
  const [tokens, setTokens] = useState<Token[]>([
    {
        collection_id: 2,
        id: "1020",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1020",
            name: "Doodle #1020",
            image: "ipfs://QmX2LeXjT29LQTCizg9FXe6bNrgCZckfQH5ky9pWr4zBKm",
            source: "ethereum",
            attributes: [
                {
                    value: "chill cig",
                    trait_type: "face"
                },
                {
                    value: "purple puffballs",
                    trait_type: "hair"
                },
                {
                    value: "blue fleece",
                    trait_type: "body"
                },
                {
                    value: "blue",
                    trait_type: "background"
                },
                {
                    value: "pink",
                    trait_type: "head"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1021",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1021",
            name: "Doodle #1021",
            image: "ipfs://QmbuXQ8KMZe5eMo3enGfg8phfpZ5RcMEHCpYWrXypr1hbV",
            source: "ethereum",
            attributes: [
                {
                    value: "green beard",
                    trait_type: "face"
                },
                {
                    value: "pink",
                    trait_type: "hair"
                },
                {
                    value: "striped sweater",
                    trait_type: "body"
                },
                {
                    value: "gradient 4",
                    trait_type: "background"
                },
                {
                    value: "pale",
                    trait_type: "head"
                },
                {
                    value: "hoop",
                    trait_type: "piercing"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1022",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1022",
            name: "Doodle #1022",
            image: "ipfs://Qmba6Kp1zsGxAmJ8YSPjpEv9SNqutz9hKZusLznpSDNAzb",
            source: "ethereum",
            attributes: [
                {
                    value: "mustache",
                    trait_type: "face"
                },
                {
                    value: "blue alfalfa",
                    trait_type: "hair"
                },
                {
                    value: "navy sweater",
                    trait_type: "body"
                },
                {
                    value: "purple",
                    trait_type: "background"
                },
                {
                    value: "med",
                    trait_type: "head"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1023",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            "uri": "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1023",
            name: "Doodle #1023",
            image: "ipfs://QmTJPr9gy9ukr8S1d2LJ5cGRNQL9Lfe9wN99fFckKdS7hZ",
            source: "ethereum",
            attributes: [
                {
                    value: "chill cig",
                    "trait_type": "face"
                },
                {
                    value: "yellow backwards cap",
                    trait_type: "hair"
                },
                {
                    value: "blue and yellow jacket",
                    trait_type: "body"
                },
                {
                    value: "purple",
                    trait_type: "background"
                },
                {
                    value: "orange",
                    trait_type: "head"
                },
                {
                    value: "pearl",
                    trait_type: "piercing"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1024",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1024",
            name: "Doodle #1024",
            image: "ipfs://QmYswa8WJs9vxQxKuLTxzKzHFpx5vUAuex3exZjkGJhUTT",
            source: "ethereum",
            attributes: [
                {
                    value: "sad note",
                    trait_type: "face"
                },
                {
                    value: "yellow bowlcut",
                    trait_type: "hair"
                },
                {
                    value: "grey hoodie",
                    trait_type: "body"
                },
                {
                    value: "blue",
                    trait_type: "background"
                },
                {
                    value: "med",
                    trait_type: "head"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1025",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1025",
            name: "Doodle #1025",
            image: "ipfs://QmYPb4j5N3dyK36B25vBgip6xjXL5233AoLYbePjZUed7f",
            source: "ethereum",
            attributes: [
                {
                    value: "aviators with mustache",
                    trait_type: "face"
                },
                {
                    value: "space",
                    trait_type: "background"
                },
                {
                    value: "pickle",
                    trait_type: "head"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1026",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1026",
            name: "Doodle #1026",
            image: "ipfs://QmNu2kUgFDrwqLYLFPuJSByvq3tWZeW2eWsZXimPTn5oDe",
            source: "ethereum",
            attributes: [
                {
                    value: "mustache",
                    trait_type: "face"
                },
                {
                    value: "beige bucket cap",
                    trait_type: "hair"
                },
                {
                    value: "yellow turtleneck",
                    trait_type: "body"
                },
                {
                    value: "purple",
                    trait_type: "background"
                },
                {
                    value: "pale",
                    trait_type: "head"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1027",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1027",
            name: "Doodle #1027",
            image: "ipfs://QmZesUdHjnPyMb4wZVa2wqEMoYmDeDfGC8dCp91AVKHcTL",
            source: "ethereum",
            attributes: [
                {
                    value: "aviators with cig",
                    trait_type: "face"
                },
                {
                    value: "halo",
                    trait_type: "hair"
                },
                {
                    value: "yellow backpack",
                    trait_type: "body"
                },
                {
                    value: "holographic",
                    trait_type: "background"
                },
                {
                    value: "yellow",
                    trait_type: "head"
                },
                {
                    value: "hoop",
                    trait_type: "piercing"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    },
    {
        collection_id: 2,
        id: "1028",
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
        data: {
            id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            uri: "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/1028",
            name: "Doodle #1028",
            image: "ipfs://QmYuXMja91161KoV7bQyP98PjQKu3BMLrm5wMJ4pVTiJ3K",
            source: "ethereum",
            attributes: [
                {
                    value: "designer glasses",
                    trait_type: "face"
                },
                {
                    value: "pink tidy",
                    trait_type: "hair"
                },
                {
                    value: "light blue puffer",
                    trait_type: "body"
                },
                {
                    value: "green",
                    trait_type: "background"
                },
                {
                    value: "purple",
                    trait_type: "head"
                },
                {
                    value: "hoop",
                    trait_type: "piercing"
                }
            ],
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury. Burnt Toast is the working alias for Scott Martin, a Canadian–based illustrator, designer, animator and muralist."
        },
        modules: [
            "erc721",
            "extending_collection",
            "extending_metadata"
        ]
    }
]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onTokenSelect) {
      onTokenSelect(tokens[0]);
    }
  }, [tokens, onTokenSelect]);

  // useEffect(() => {
  //   setLoading(true);
  //   getRandomTokensByAttribute('image', 9)
  //     .then((data) => {
  //       // Only keep tokens with a valid image string
  //       const filtered = data.filter(
  //         (token) => typeof token.data?.image === 'string' && token.data.image.length > 0
  //       );
  //       setTokens(filtered);
  //       if (!selectedToken) {
  //         onTokenSelect?.(filtered[0]);
  //       }
  //     })
  //     .catch(() => setTokens([]))
  //     .finally(() => setLoading(false));
  // }, [onTokenSelect]);

  // Don't shuffle tokens on each render, instead cache them in a stable order
  const [featured, ...others] = tokens;
  
  // We'll only sort/shuffle the tokens once when they're first loaded
  const [displayTokens, setDisplayTokens] = useState<Token[]>([]);
  
  useEffect(() => {
    if (others && others.length > 0) {
      const sorted = [...others].sort(() => 0.5 - Math.random());
      setDisplayTokens(sorted.slice(0, 12)); // Show up to 12 others for a 4x3 grid
    }
  }, [tokens]);

  const imageUri = (uri: string) => {
    if (uri.startsWith('ipfs://')) {
      return `https://router1.testnet.megayours.com/ext/${uri}`;
    }
    return uri;
  }

  // Hover effect classes
  const hoverEffect =
    'transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:ring-4 hover:ring-[#AAC4E7]/40 focus:outline-none focus:ring-4 focus:ring-[#AAC4E7]/60 cursor-pointer';
  const cardBase = 'shadow-xl bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl';
  const featuredGlow = 'relative before:content-[""] before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-[#AAC4E7]/40 before:to-[#E9D973]/30 before:blur-2xl before:opacity-70 before:-z-10';
  
  // Active selection effect
  const selectedEffect = 'ring-4 ring-[#E9D973] after:content-[""] after:absolute after:bottom-3 after:right-3 after:w-6 after:h-6 after:bg-[#E9D973] after:rounded-full after:shadow-md after:flex after:items-center after:justify-center';

  return (
    <section id="token-gallery" className="relative py-8 min-h-[80vh] flex flex-col items-center justify-center">
      
      {instructionBanner && (
        <div className="mb-6 mt-2 w-full text-center">
          {instructionBanner}
        </div>
      )}
      
      <div className="mx-auto max-w-3xl py-2 px-4 lg:px-6">
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
                <div
                  onClick={() => onTokenSelect?.(featured)}
                  tabIndex={0}
                  className={`relative col-span-2 row-span-2 overflow-hidden flex items-center justify-center group aspect-square ${cardBase} ${hoverEffect} ${featuredGlow} ${selectedToken?.id === featured.id ? selectedEffect : ''} lg:col-span-2 lg:row-span-2`}
                  aria-label="View collection"
                  style={{ zIndex: 1 }}
                >
                  <img
                    src={imageUri(featured.data.image)}
                    alt="Art token"
                    className="w-full h-full object-contain rounded-3xl drop-shadow-xl"
                    style={{ display: 'block' }}
                  />
                </div>
                {/* Up to 12 small images for desktop, 5 for mobile */}
                {displayTokens.map((token, i) => (
                  <div
                    key={token.id}
                    onClick={() => onTokenSelect?.(token)}
                    tabIndex={0}
                    className={`relative rounded-2xl overflow-hidden flex items-center justify-center group aspect-square ${cardBase} ${hoverEffect} ${selectedToken?.id === token.id ? selectedEffect : ''}`}
                    aria-label="View collection"
                  >
                    <img
                      src={imageUri(token.data.image)}
                      alt="Art token"
                      className="w-full h-full object-contain rounded-2xl drop-shadow-md"
                      style={{ display: 'block' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 