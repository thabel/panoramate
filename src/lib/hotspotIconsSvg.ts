/**
 * Hotspot Icons as inline SVG
 * Maps icon names to their SVG representations
 */

export const HOTSPOT_ICONS_SVG: Record<string, string> = {
  'ArrowRight': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
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

  'Video': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="15" height="10" rx="2" ry="2"/><polygon points="23 7 16 12 23 17 23 7"/>
  </svg>`,

  // Custom icons
  'info': `<svg width="24" height="24" viewBox="0 0 10 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M5.326.33c1.5 0 2.646 1.235 2.646 2.646C7.883 4.475 6.737 5.62 5.326 5.62c-1.5 0-2.646-1.234-2.646-2.645C2.68 1.476 3.915.33 5.326.33Zm3.792 17.814c-.794 2.91-8.554 3.175-8.025-.793.353-2.646.882-5.204 1.323-7.761.264-1.676-.794-1.147-1.764-1.5-.617-.264-.617-1.058.176-1.234.97-.265 4.41-.088 5.556-.088.618 0 .97.353 1.059.97 0 .53-.089.97-.177 1.5-.44 2.468-1.058 5.114-1.41 7.583 0 .53.087 1.5.881 1.411.794 0 1.146-.352 1.764-.617.353-.176.705.088.617.53Z"/>
  </svg>`,

  'bed': `<svg width="24" height="24" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.29 7.643c.127-.218.194-.466.194-.719v-.273a1.437 1.437 0 0 0-.42-1.017l-.658-.654v-.212h1.844l-.45-3.594h-3.507l-.45 3.594h1.845v.212l-.658.654a1.44 1.44 0 0 0-.42 1.017v.273c0 .253.067.5.193.72h-1.631v6.108h5.75V7.643H19.29zm-.524 1.797h-1.438V8.72h1.438v.719zm0 2.516h-1.438v-.72h1.438v.72zM14.094 7.754a2.227 2.227 0 0 0-.719-1.645V.815h-.719v.719H1.875v-.72h-.719V6.11a2.232 2.232 0 0 0-.718 1.645v.608h-.36v5.39h.719v-2.515h12.937v2.515h.72v-5.39h-.36v-.608zm-11.5-2.267V4.409A1.078 1.078 0 0 1 3.672 3.33h2.156a1.078 1.078 0 0 1 1.078 1.078v1.078H2.594zm5.031-1.078A1.078 1.078 0 0 1 8.703 3.33h2.156a1.078 1.078 0 0 1 1.079 1.078v1.078H7.625V4.409zM1.156 7.754a1.53 1.53 0 0 1 .586-1.19c.27-.228.61-.355.963-.358h9.121c.353.003.694.13.963.359l.04.032a1.522 1.522 0 0 1 .546 1.157v.608H1.156v-.608z" fill="currentColor"/>
  </svg>`,

  'card': `<svg width="24" height="24" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M1.212.007a.833.833 0 1 0 0 1.667h1.483a.578.578 0 0 1 .548.395l2.748 8.244c.122.366.137.76.044 1.134l-.226.907c-.332 1.328.701 2.653 2.07 2.653h10a.833.833 0 0 0 0-1.667h-10a.45.45 0 0 1-.454-.58l.17-.682a.534.534 0 0 1 .518-.404h8.933c.358 0 .677-.23.79-.57l2.222-6.667a.833.833 0 0 0-.79-1.097H5.84a.578.578 0 0 1-.548-.395L4.503.577a.833.833 0 0 0-.79-.57h-2.5zM7.046 15.84a1.667 1.667 0 1 0 0 3.334 1.667 1.667 0 0 0 0-3.334zm10 0a1.667 1.667 0 1 0 0 3.334 1.667 1.667 0 0 0 0-3.334z"/>
  </svg>`,
};

export const getHotspotIconSvg = (iconName: string): string => {
  return HOTSPOT_ICONS_SVG[iconName] || HOTSPOT_ICONS_SVG['info'];
};
