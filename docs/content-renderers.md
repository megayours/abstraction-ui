# Content Renderers

This documentation describes the content renderer system implemented to dynamically display different content types including images, and future additions like videos, PDFs, etc.

## Overview

The content renderer system detects the type of content (starting with URLs) and renders it using the appropriate component. The system is composed of:

1. URL detection utilities
2. A content renderer factory
3. Specialized renderers (e.g., ImageRenderer)
4. A main ContentRenderer component

## URL Detection System

Located in `src/lib/utils/url-detection.ts`, this module provides:

- URL detection (including IPFS URLs)
- Content-type detection through HTTP requests
- Normalization of IPFS URLs to HTTP gateway URLs
- Fast detection of likely image URLs based on file extension

```typescript
import { isUrl, fetchUrlMetadata, isLikelyImage } from "@/lib/utils/url-detection";

// Check if a string is a URL
const isWebUrl = isUrl("https://example.com/image.jpg"); // true

// Check if a string is likely an image URL by extension
const likelyImage = isLikelyImage("https://example.com/image.jpg"); // true

// Fetch metadata about a URL (async)
const metadata = await fetchUrlMetadata("https://example.com/image.jpg");
// Returns object with content type, format flags (isImage, isVideo, etc.)
```

## Renderer Factory

Located in `src/components/renderers/RendererFactory.tsx`, this module provides:

- A common interface for all content renderers
- A registry of renderer components by content type
- Functions to get, register, and manage renderers

```typescript
import { 
  registerRenderer, 
  getRendererComponent 
} from "@/components/renderers";

// Register a custom renderer for a specific content type
registerRenderer("custom", MyCustomRenderer);

// Get a renderer component for specific metadata
const Renderer = getRendererComponent(metadata);
if (Renderer) {
  return <Renderer url={url} />;
}
```

## Adding a New Renderer

To add a new renderer for a different content type:

1. Create a new renderer component implementing the `ContentRendererProps` interface:

```typescript
import { ContentRendererProps } from "@/components/renderers";

export default function VideoRenderer({ url, className }: ContentRendererProps) {
  // Implementation for video rendering
  return (
    <video 
      src={url} 
      className={className} 
      controls 
    />
  );
}
```

2. Register the renderer in the factory:

```typescript
import { registerRenderer } from "@/components/renderers";
import VideoRenderer from "./VideoRenderer";

// Register in your app initialization
registerRenderer("video", VideoRenderer);
```

3. Update the factory to detect and use the new renderer:

```typescript
// In RendererFactory.tsx
export function getRendererComponent(metadata: UrlMetadata) {
  // Existing code...
  if (metadata.isImage) {
    return defaultRenderers.image;
  }
  
  // Add new condition
  if (metadata.isVideo) {
    return defaultRenderers.video;
  }
  
  // ...
}
```

## Usage

To use the content renderer system:

```tsx
import { ContentRenderer } from "@/components/renderers";

function MyComponent() {
  // Automatically detects and renders the appropriate content
  return <ContentRenderer value="https://example.com/image.jpg" />;
}
```

## Implementation Details

The system uses the following approach:

1. Check if a string is a URL
2. For fast rendering of images, check if the URL has an image extension
3. Make an HTTP request to get the content type
4. Use the factory to get the appropriate renderer
5. Render the content using the selected renderer
6. Provide fallbacks for loading states and errors

## Future Enhancements

Potential areas for expansion:

- Add renderers for videos, audio, PDFs, etc.
- Support for embedded content (e.g., YouTube, Spotify)
- Lazy-loading of renderer components for performance
- Caching of content type information
- Custom renderers for specific domains or services 