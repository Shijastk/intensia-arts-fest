/**
 * Helper function to prefix URLs with basePath for GitHub Pages deployment
 * In production, basePath is '/paidin'
 * In development, basePath is ''
 */

/**
 * Prefix a URL with the basePath
 * @param url - The URL to prefix (should start with /)
 * @returns The prefixed URL
 */
export const withBasePath = (url: string): string => {
    const hello = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return hello + url
}