/**
 * Hotspot Icon Catalog
 * Uses Lucide React icons - no need to download SVG files!
 * Each icon is a selectable option for hotspots
 */

export const HOTSPOT_ICONS = [
  {
    id: 'navigation',
    name: 'Navigation',
    iconName: 'ArrowRight',
    description: 'Navigate to another scene',
    color: '#3b82f6', // blue
  },
  {
    id: 'info',
    name: 'Information',
    iconName: 'Info',
    description: 'Display information',
    color: '#6366f1', // indigo
  },
  {
    id: 'external-link',
    name: 'External Link',
    iconName: 'ExternalLink',
    description: 'Open external website',
    color: '#8b5cf6', // purple
  },
  {
    id: 'play',
    name: 'Play Video',
    iconName: 'Play',
    description: 'Play a video',
    color: '#ec4899', // pink
  },
  {
    id: 'message',
    name: 'Message',
    iconName: 'MessageCircle',
    description: 'Show a message/comment',
    color: '#f59e0b', // amber
  },
  {
    id: 'camera',
    name: 'Camera',
    iconName: 'Camera',
    description: 'Photo gallery or details',
    color: '#10b981', // emerald
  },
  {
    id: 'link',
    name: 'Link',
    iconName: 'Link',
    description: 'General hyperlink',
    color: '#06b6d4', // cyan
  },
  {
    id: 'map-pin',
    name: 'Location',
    iconName: 'MapPin',
    description: 'Mark a location',
    color: '#ef4444', // red
  },
  {
    id: 'star',
    name: 'Favorite',
    iconName: 'Star',
    description: 'Mark as favorite',
    color: '#eab308', // yellow
  },
  {
    id: 'help-circle',
    name: 'Help',
    iconName: 'HelpCircle',
    description: 'Help or FAQ',
    color: '#14b8a6', // teal
  },
] as const;

export type HotspotIconId = typeof HOTSPOT_ICONS[number]['id'];

// Helper to get icon config by ID
export const getHotspotIconConfig = (iconId: string) => {
  return HOTSPOT_ICONS.find(icon => icon.id === iconId);
};

// Helper to get all icon names for Lucide import
export const getHotspotIconNames = () => {
  return HOTSPOT_ICONS.map(icon => icon.iconName);
};
