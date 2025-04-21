"use client";

import React, { useState } from "react";
import Image from "next/image";
import { normalizeIpfsUrl } from "@/lib/utils/url-detection";
import type { ContentRendererProps } from "./RendererFactory";

export default function ImageRenderer({
  url,
  alt = "Image",
  className = "",
  width,
  height,
}: ContentRendererProps & { alt?: string; width?: number; height?: number; }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const normalizedUrl = normalizeIpfsUrl(url);
  
  // Use more precise size calculations if provided
  const aspectRatio = width && height ? width / height : 4/3;
  const displayWidth = width || 600; // Larger default size
  const displayHeight = height || Math.round(displayWidth / aspectRatio);

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      {/* Container with fixed aspect ratio to prevent layout shift */}
      <div 
        className="relative w-full overflow-hidden rounded-lg shadow-md bg-white"
        style={{ 
          maxWidth: `${displayWidth}px`,
          aspectRatio: `${aspectRatio}`,
          margin: "0 auto" 
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="mt-2 text-sm text-gray-500">Loading image...</span>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-6 text-center">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938-9H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              <p className="text-gray-500 text-sm">Failed to load image</p>
              <a 
                href={normalizedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Open directly
              </a>
            </div>
          </div>
        ) : (
          // Image with proper sizing and transitions
          <Image
            src={normalizedUrl}
            alt={alt}
            width={displayWidth}
            height={displayHeight}
            className={`w-full h-full object-contain transition-all duration-500 ${
              isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            unoptimized // Use for external URLs, including IPFS
            priority={true} // Load with higher priority
          />
        )}
      </div>
      
      {/* Image attribution/source URL */}
      {!isLoading && !hasError && (
        <div className="mt-2 text-center">
          <a 
            href={normalizedUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-blue-500 hover:underline"
          >
            View original
          </a>
        </div>
      )}
    </div>
  );
} 