import { JSONSchema7 } from 'json-schema';

const megadataSchema: JSONSchema7 = {
  type: 'object',
  required: ['erc721'],
  properties: {
    erc721: {
      type: 'object',
      required: ['name', 'description', 'image'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        external_url: { type: 'string', format: 'uri' },
        image: { type: 'string', format: 'uri' },
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['trait_type', 'value'],
            properties: {
              trait_type: { type: 'string' },
              value: { type: ['string', 'number'] },
              display_type: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  lastModified?: number;
}

export function validateMegadata(data: any): ValidationResult {
  const errors: string[] = [];

  // Check if data is an array (batch import) or a single object (editor)
  if (Array.isArray(data)) {
    // Validate each item in the array
    data.forEach((item, index) => {
      if (!item.tokenId) {
        errors.push(`Item ${index}: Missing required property: tokenId`);
      }

      // Handle both properties and megadata fields for backward compatibility
      const metadata = item.properties?.erc721 || item.megadata?.erc721;
      
      if (!metadata) {
        errors.push(`Item ${index}: Missing required metadata structure. Need either properties.erc721 or megadata.erc721`);
        return;
      }

      validateMetadata({ erc721: metadata }, errors, index);
    });
  } else if (typeof data === 'object' && data !== null) {
    // Validate single metadata object (editor case)
    validateMetadata(data, errors);
  } else {
    errors.push('Data must be either an array of objects or a single metadata object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateMetadata(metadata: any, errors: string[], itemIndex?: number): void {
  const prefix = itemIndex !== undefined ? `Item ${itemIndex}: ` : '';

  if (metadata.erc721) {
    if (!metadata.erc721.name) errors.push(`${prefix}Missing required property: erc721.name`);
    if (!metadata.erc721.description) errors.push(`${prefix}Missing required property: erc721.description`);
    if (!metadata.erc721.image) errors.push(`${prefix}Missing required property: erc721.image`);

    // Validate URLs if present
    if (metadata.erc721.external_url && !isValidUrl(metadata.erc721.external_url)) {
      errors.push(`${prefix}Invalid external_url format`);
    }
    if (metadata.erc721.image && !isValidUrl(metadata.erc721.image)) {
      errors.push(`${prefix}Invalid image URL format`);
    }

    // Validate attributes if present
    if (metadata.erc721.attributes && Array.isArray(metadata.erc721.attributes)) {
      metadata.erc721.attributes.forEach((attr: any, attrIndex: number) => {
        if (!attr.trait_type) {
          errors.push(`${prefix}Attribute ${attrIndex}: Missing required property: erc721.attributes[${attrIndex}].trait_type`);
        }
        if (attr.value === undefined) {
          errors.push(`${prefix}Attribute ${attrIndex}: Missing required property: erc721.attributes[${attrIndex}].value`);
        }
      });
    }
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
} 