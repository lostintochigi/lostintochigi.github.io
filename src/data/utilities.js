// Vibe-coded utilities shown on the /utilities page.
//
// To add one, append an object to this array:
//   name        – card title
//   description – one or two sentences on what it does
//   url         – where it lives. Either:
//                   • a React page in this app: '/utilities/<slug>' (opens in the same tab)
//                   • a self-hosted tool: put it in public/tools/<slug>/index.html
//                     and use '/tools/<slug>/'
//                   • any external link (GitHub repo, Vercel app, etc.)
//   tags        – optional list of short labels
//   date        – optional, e.g. '2026-11'
//
// Example:
//   {
//     name: 'JSON Formatter',
//     description: 'Paste messy JSON, get it pretty-printed and validated.',
//     url: '/tools/json-formatter/',
//     tags: ['dev', 'json'],
//     date: '2026-11',
//   },

const utilities = [
    {
        name: 'HK Water Fountains',
        description:
            'Map of 1,000+ drinking fountains in Hong Kong parks, pools, beaches and sports centres. Filter by open now, cold water and district, or find the nearest one.',
        url: '/utilities/hk-water-fountains',
        tags: ['hong kong', 'map', 'open data'],
        date: '2026-11',
    },
    {
        name: 'HK Michelin Map',
        description:
            "Every Hong Kong restaurant with MICHELIN stars or a Bib Gourmand in the 2026 guide, on one map. Filter by stars, cuisine and district, or find what's near you.",
        url: '/utilities/hk-michelin',
        tags: ['hong kong', 'map', 'food'],
        date: '2026-11',
    },
]

export default utilities
