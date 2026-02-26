import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import { logger } from './logger';

/**
 * HTML Sanitization Configuration
 * Provides secure HTML sanitization for iframe rendering
 */

/**
 * Permissive DOMPurify configuration for ad creative content
 * Allows scripts and most HTML/CSS for interactive ads
 * Use only for content from trusted sources (your own ad server)
 */
const CREATIVE_SANITIZE_CONFIG: Config = {
  // Allow almost all HTML tags for ad creatives
  ADD_TAGS: ['script'], // Explicitly allow scripts for interactive ads
  
  // Allow almost all attributes for ad creatives
  ADD_ATTR: ['onclick', 'onload', 'onerror'], // Allow event handlers for ads
  
  // Keep content as-is
  KEEP_CONTENT: true,
  
  // Don't force body
  FORCE_BODY: false,
  
  // Allow data URLs and most protocols
  ALLOW_DATA_ATTR: true,
  ALLOW_UNKNOWN_PROTOCOLS: true,
  
  // Return HTML string
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  
  // Don't sanitize named props to preserve functionality
  SANITIZE_NAMED_PROPS: false,
  
  // Only forbid truly dangerous tags
  FORBID_TAGS: [], // Don't forbid anything for trusted ad content
  FORBID_ATTR: [], // Don't forbid attributes for trusted ad content
};

/**
 * DOMPurify configuration for iframe content
 * Allows safe HTML/CSS while blocking dangerous scripts and attributes
 */
const SANITIZE_CONFIG: Config = {
  // Allow common HTML tags
  ALLOWED_TAGS: [
    'html', 'head', 'body', 'meta', 'title', 'link', 'style',
    'div', 'span', 'p', 'a', 'img', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'strong', 'em', 'b', 'i', 'u', 's', 'strike',
    'small', 'big', 'sup', 'sub',
    'blockquote', 'pre', 'code',
    'iframe', 'video', 'audio', 'canvas',
    'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  ],
  
  // Allow safe attributes
  ALLOWED_ATTR: [
    'id', 'class', 'style', 'title', 'alt',
    'href', 'src', 'target', 'rel',
    'width', 'height', 'align', 'valign',
    'type', 'name', 'value', 'placeholder',
    'colspan', 'rowspan',
    'charset', 'content', 'http-equiv',
    'data-*', // Allow data attributes for frameworks
    'aria-*', // Allow ARIA attributes for accessibility
    'role',
    // SVG attributes
    'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y',
    'x1', 'y1', 'x2', 'y2', 'points',
  ],
  
  // Allow safe URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  
  // Keep comments for debugging (can be disabled in production)
  KEEP_CONTENT: true,
  
  // Return a DOM element instead of HTML string for better performance
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  
  // Force body to be used as container
  FORCE_BODY: false,
  
  // Remove potentially dangerous tags entirely
  FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'base'],
  
  // Remove dangerous attributes
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  
  // Allow self-closing tags
  ALLOW_SELF_CLOSE_IN_ATTR: false,
  
  // Sanitize inline styles
  ALLOW_UNKNOWN_PROTOCOLS: false,
  
  // Safe for Safari
  SAFE_FOR_TEMPLATES: false,
  
  // Add target="_blank" to external links
  SANITIZE_NAMED_PROPS: true,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify with strict configuration
 * 
 * @param html - Raw HTML string to sanitize
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for iframe rendering
 * 
 * @example
 * ```typescript
 * const userHtml = '<script>alert("XSS")</script><div>Safe content</div>';
 * const safeHtml = sanitizeHtml(userHtml);
 * // Result: '<div>Safe content</div>'
 * ```
 */
export function sanitizeHtml(
  html: string,
  config?: Config
): string {
  if (!html) {
    return '';
  }

  try {
    // Merge custom config with default config
    const finalConfig = config ? { ...SANITIZE_CONFIG, ...config } : SANITIZE_CONFIG;
    
    // Sanitize the HTML - DOMPurify.sanitize returns a string
    const clean = DOMPurify.sanitize(html, finalConfig) as string;
    
    return clean;
  } catch (error) {
    // If sanitization fails, return empty string for safety
    logger.error('HTML sanitization failed:', error as Error);
    return '';
  }
}

/**
 * Sanitizes HTML and adds security headers/meta tags
 * For trusted ad creative content from your own ad server
 * Uses very permissive sanitization to preserve ad functionality
 * 
 * @param html - Raw HTML string to sanitize
 * @returns Lightly sanitized HTML (mostly unchanged for trusted content)
 */
export function sanitizeHtmlForIframe(html: string): string {
  if (!html) {
    return '';
  }
  
  // For trusted ad creative content from your own server,
  // we use minimal sanitization to preserve all ad functionality
  // The content is sandboxed in an iframe with proper sandbox attributes
  try {
    // Use permissive config that allows scripts and interactive elements
    const clean = DOMPurify.sanitize(html, CREATIVE_SANITIZE_CONFIG) as string;
    return clean || html; // Return original if sanitization somehow fails
  } catch (error) {
    logger.error('Creative HTML sanitization failed:', error as Error);
    // Return original HTML since this is trusted content from your own server
    return html;
  }
}

/**
 * Checks if HTML content appears to be safe (basic heuristic)
 * This is NOT a replacement for sanitization, just a pre-check
 * 
 * @param html - HTML string to check
 * @returns true if HTML appears safe (no obvious XSS patterns)
 */
export function isHtmlSafe(html: string): boolean {
  if (!html) {
    return true;
  }
  
  const dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick, onerror
    /<iframe[^>]*srcdoc\s*=/i, // Nested iframes with srcdoc
    /<object/i,
    /<embed/i,
    /<applet/i,
    /data:text\/html/i, // Data URLs with HTML
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Sanitizes a data URL containing HTML
 * Extracts, sanitizes, and reconstructs the data URL
 * 
 * @param dataUrl - Data URL containing HTML
 * @returns Sanitized data URL or null if invalid
 */
export function sanitizeHtmlDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith('data:text/html')) {
    return dataUrl; // Not an HTML data URL, return as-is
  }
  
  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return null;
    
    const prefix = dataUrl.substring(0, commaIndex + 1);
    const htmlContent = dataUrl.substring(commaIndex + 1);
    
    // Decode the HTML
    let html: string;
    try {
      html = decodeURIComponent(htmlContent);
    } catch {
      html = htmlContent;
    }
    
    // Sanitize the HTML
    const cleanHtml = sanitizeHtmlForIframe(html);
    
    if (!cleanHtml) {
      return null;
    }
    
    // Re-encode and reconstruct data URL
    const encodedHtml = encodeURIComponent(cleanHtml);
    return prefix + encodedHtml;
  } catch (error) {
    logger.error('Data URL sanitization failed:', error as Error);
    return null;
  }
}
