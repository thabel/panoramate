/**
 * Hotspot Icons as inline SVG
 * Maps icon names to their SVG representations
 */

export const HOTSPOT_ICONS_SVG: Record<string, string> = {
  'ArrowRight': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>`,

  'Info': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>`,

  'ExternalLink': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
  </svg>`,

  'Play': `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>`,

  'MessageCircle': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,

  'Camera': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>`,

  'Link': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>`,

  'MapPin': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>`,

  'Star': `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 10.26 24 10.27 17.82 16.38 20.91 24.59 12 18.49 3.09 24.59 6.18 16.38 0 10.27 8.91 10.26 12 2"/>
  </svg>`,

  'HelpCircle': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>`,

  // Custom icons
  'info': `<svg width="24" height="24" viewBox="0 0 10 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M5.326.33c1.5 0 2.646 1.235 2.646 2.646C7.883 4.475 6.737 5.62 5.326 5.62c-1.5 0-2.646-1.234-2.646-2.645C2.68 1.476 3.915.33 5.326.33Zm3.792 17.814c-.794 2.91-8.554 3.175-8.025-.793.353-2.646.882-5.204 1.323-7.761.264-1.676-.794-1.147-1.764-1.5-.617-.264-.617-1.058.176-1.234.97-.265 4.41-.088 5.556-.088.618 0 .97.353 1.059.97 0 .53-.089.97-.177 1.5-.44 2.468-1.058 5.114-1.41 7.583 0 .53.087 1.5.881 1.411.794 0 1.146-.352 1.764-.617.353-.176.705.088.617.53Z"/>
  </svg>`,

  'bed': `<svg width="24" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M26 2H4c-1.1 0-2 .9-2 2v14h2V6h20v12h2V4c0-1.1-.9-2-2-2zm0 16H4c-1.1 0-2 .9-2 2s.9 2 2 2h22c1.1 0 2-.9 2-2s-.9-2-2-2zm-12-6H6v-4h8v4zm12 0h-8v-4h8v4z"/>
  </svg>`,

  'card': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="2"/>
  </svg>`,

  'doublearrow': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12h14M12 5l7 7-7 7M5 12l7-7v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>`,
};

export const getHotspotIconSvg = (iconName: string): string => {
  return HOTSPOT_ICONS_SVG[iconName] || HOTSPOT_ICONS_SVG['Info'];
};
