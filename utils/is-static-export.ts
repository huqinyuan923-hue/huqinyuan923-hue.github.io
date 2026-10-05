// Set to true when building for GitHub Pages (static export): the /api routes
// are disabled at build time, so client code must skip fetching them.
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
