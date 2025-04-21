"use client";

import React, { useEffect, useState } from "react";
import { isUrl, fetchUrlMetadata, UrlMetadata, isLikelyImage } from "@/lib/utils/url-detection";
import { getRendererComponent } from "./RendererFactory";
import ImageRenderer from "./ImageRenderer";

type ContentRendererComponentProps = {
  value: string;
  className?: string;
};

/**
 * ContentRenderer component that detects content type from a string value
 * and renders the appropriate components based on detected type
 */
export default function ContentRenderer({ value, className = "" }: ContentRendererComponentProps) {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fast detection for likely images, so we can render them immediately
  const isLikelyImageUrl = isUrl(value) && isLikelyImage(value);

  useEffect(() => {
    // Only process if value looks like a URL
    if (!value || !isUrl(value)) return;

    const detectContentType = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const meta = await fetchUrlMetadata(value);
        setMetadata(meta);
        
        if (meta.error) {
          setError(meta.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    detectContentType();
  }, [value]);

  // If not a URL, render as plain text
  if (!value || !isUrl(value)) {
    return <div className={`text-gray-800 break-words ${className}`}>{value}</div>;
  }
  
  // If we can immediately tell it's an image by extension, render it right away
  // and let the metadata fetch happen in the background
  if (isLikelyImageUrl && !metadata) {
    return (
      <>
        <ImageRenderer url={value} className={className} />
        {loading && <div className="sr-only">Verifying content type...</div>}
      </>
    );
  }
  
  // Show loading state only if we don't know what type it is yet
  if (loading && !isLikelyImageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500 text-sm">Loading content...</div>
        <div className="text-xs text-gray-400 mt-2 max-w-sm text-center">
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </div>
      </div>
    );
  }

  // If error while fetching metadata and it's not a likely image
  if (error && !isLikelyImageUrl) {
    return (
      <div className={`p-4 rounded-lg border border-gray-200 bg-gray-50 ${className}`}>
        <div className="text-gray-600 mb-2 break-words">{value}</div>
        <div className="text-red-500 text-sm">{error}</div>
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 text-sm hover:underline mt-2 inline-block"
        >
          Open URL directly
        </a>
      </div>
    );
  }

  // If we have metadata, render based on content type
  if (metadata) {
    // Get appropriate renderer for this content type
    const RendererComponent = getRendererComponent(metadata);
    
    // If we have a renderer, use it
    if (RendererComponent) {
      return <RendererComponent url={value} className={className} />;
    }
    
    // For any other content types, render as enhanced link card
    return (
      <div className={`p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors duration-200 bg-white shadow-sm ${className}`}>
        <div className="flex items-start">
          <div className="mr-3">
            {/* Simple icon based on content type */}
            {metadata.isJson && (
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-500">
                {"{…}"}
              </div>
            )}
            {metadata.isHtml && (
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                {"</>"}
              </div>
            )}
            {metadata.isPdf && (
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
                PDF
              </div>
            )}
            {!(metadata.isJson || metadata.isHtml || metadata.isPdf) && (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <a 
              href={metadata.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium block truncate"
            >
              {value}
            </a>
            {metadata.contentType && (
              <div className="text-xs text-gray-500 mt-1">
                {metadata.contentType}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback when we don't have metadata yet: render as link
  return (
    <a 
      href={value} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`text-blue-600 hover:underline block p-2 ${className}`}
    >
      {value}
    </a>
  );
} 