/**
 * Hotspot Icon Configuration
 * Defines icon types, labels, required fields, and input specifications
 */

export type HotspotIconType =
  | 'ArrowRight'
  | 'ExternalLink'
  | 'Play'
  | 'MessageCircle'
  | 'Camera'
  | 'Link'
  | 'MapPin'
  | 'Video'
  | 'info';

export type HotspotFieldType = 'title' | 'targetImageId' | 'url' | 'content' | 'videoUrl' | 'imageUrls';

export interface IconFieldSpec {
  name: HotspotFieldType;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'file-upload' | 'file-upload-multiple';
  required: boolean;
  placeholder?: string;
  description?: string;
  maxCount?: number; // For multi-file uploads
}

export interface IconConfig {
  label: string;
  description: string;
  fields: IconFieldSpec[];
}

export const HOTSPOT_ICON_CONFIG: Record<HotspotIconType, IconConfig> = {
  'ArrowRight': {
    label: 'Scene Navigation',
    description: 'Navigate to the next scene',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Next Room',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'targetImageId',
        label: 'Target Scene',
        type: 'select',
        required: true,
        description: 'The scene to navigate to when clicked'
      }
    ]
  },

  'ExternalLink': {
    label: 'External Link',
    description: 'Link to an external website',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Visit Website',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'url',
        label: 'External URL',
        type: 'text',
        required: true,
        placeholder: 'https://example.com',
        description: 'The URL to open when clicked'
      }
    ]
  },

  'Play': {
    label: 'Play Video',
    description: 'Play a video (upload or link)',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Watch Demo',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'videoUrl',
        label: 'Video (Upload or URL)',
        type: 'file-upload',
        required: true,
        description: 'Upload a video file or provide a video URL'
      }
    ]
  },

  'MessageCircle': {
    label: 'Message Box',
    description: 'Display a text message',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Info Box',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'content',
        label: 'Message Text',
        type: 'textarea',
        required: true,
        placeholder: 'Enter your message here...',
        description: 'The text content shown in the message box'
      }
    ]
  },

  'Camera': {
    label: 'Image Gallery',
    description: 'Display one or two images',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Photo Gallery',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'imageUrls',
        label: 'Images (Upload 1-2 images)',
        type: 'file-upload-multiple',
        required: true,
        maxCount: 2,
        description: 'Upload up to 2 images for the gallery'
      }
    ]
  },

  'Link': {
    label: 'Web Link',
    description: 'Link to a website',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Learn More',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'url',
        label: 'Web URL',
        type: 'text',
        required: true,
        placeholder: 'https://example.com',
        description: 'The URL to open when clicked'
      }
    ]
  },

  'MapPin': {
    label: 'Location Navigation',
    description: 'Navigate to another location/scene',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Main Lobby',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'targetImageId',
        label: 'Target Scene',
        type: 'select',
        required: true,
        description: 'The scene to navigate to when clicked'
      }
    ]
  },

  'Video': {
    label: 'Video Embed',
    description: 'Embed or upload a video',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Tour Video',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'videoUrl',
        label: 'Video (Upload or URL)',
        type: 'file-upload',
        required: true,
        description: 'Upload a video file or provide a video URL'
      }
    ]
  },

  'info': {
    label: 'Information Box',
    description: 'Display information text',
    fields: [
      {
        name: 'title',
        label: 'Hotspot Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Info',
        description: 'The label shown when hovering over this hotspot'
      },
      {
        name: 'content',
        label: 'Information Text',
        type: 'textarea',
        required: true,
        placeholder: 'Enter your information here...',
        description: 'The text content shown in the information box'
      }
    ]
  }
};

/**
 * Get configuration for a specific icon type
 */
export const getIconConfig = (iconType: HotspotIconType): IconConfig => {
  return HOTSPOT_ICON_CONFIG[iconType] || HOTSPOT_ICON_CONFIG['MapPin'];
};

/**
 * Get required fields for an icon type
 */
export const getRequiredFields = (iconType: HotspotIconType): HotspotFieldType[] => {
  const config = getIconConfig(iconType);
  return config.fields.filter(f => f.required).map(f => f.name);
};

/**
 * Validate hotspot data against icon type requirements
 */
export const validateHotspotData = (
  iconType: HotspotIconType,
  data: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getIconConfig(iconType);

  for (const field of config.fields) {
    if (field.required && !data[field.name]) {
      errors.push(`${field.label} is required for ${config.label}`);
    }
  }

  // Special validation for specific fields
  if (data.url && !isValidUrl(data.url)) {
    errors.push('Please provide a valid URL');
  }

  if (data.imageUrls && Array.isArray(data.imageUrls)) {
    if (data.imageUrls.length === 0) {
      errors.push('At least one image is required');
    }
    if (data.imageUrls.length > 2) {
      errors.push('Maximum 2 images allowed');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Simple URL validation
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (_) {
    return false;
  }
};
