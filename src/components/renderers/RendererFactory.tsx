"use client";

import React, { ComponentType } from "react";
import { UrlMetadata } from "@/lib/utils/url-detection";

/**
 * Base props for all content renderers
 */
export type ContentRendererProps = {
  url: string;
  className?: string;
};

/**
 * Registry of renderer components by content type
 */
export type RendererRegistry = {
  [key: string]: ComponentType<ContentRendererProps>;
};

/**
 * Default renderer registry with built-in renderers
 * This will be populated via registerRenderer
 */
const defaultRenderers: RendererRegistry = {};

/**
 * Factory to get an appropriate renderer component based on URL metadata
 */
export function getRendererComponent(metadata: UrlMetadata): ComponentType<ContentRendererProps> | null {
  // Check for image types
  if (metadata.isImage && defaultRenderers.image) {
    return defaultRenderers.image;
  }
  
  // Add more content type checks here
  // if (metadata.isVideo && defaultRenderers.video) return defaultRenderers.video;
  // if (metadata.isPdf && defaultRenderers.pdf) return defaultRenderers.pdf;
  
  // No specific renderer available
  return null;
}

/**
 * Register a new renderer for a specific content type
 */
export function registerRenderer(contentType: string, component: ComponentType<ContentRendererProps>): void {
  defaultRenderers[contentType] = component;
}

/**
 * Get all registered renderers
 */
export function getRegisteredRenderers(): RendererRegistry {
  return { ...defaultRenderers };
} 