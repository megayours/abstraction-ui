/**
 * Content renderers for various data types
 */

// First import the factory
import { 
  registerRenderer, 
  getRendererComponent, 
  getRegisteredRenderers,
  type ContentRendererProps,
  type RendererRegistry
} from './RendererFactory';

// Then import renderers
import ContentRenderer from './ContentRenderer';
import ImageRenderer from './ImageRenderer';

// Register renderers
registerRenderer("image", ImageRenderer);

// Finally export everything
export { 
  ContentRenderer,
  ImageRenderer,
  getRendererComponent, 
  registerRenderer, 
  getRegisteredRenderers,
  type ContentRendererProps,
  type RendererRegistry
}; 