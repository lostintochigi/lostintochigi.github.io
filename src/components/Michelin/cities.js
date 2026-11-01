// Per-city settings for the Michelin map pages. Data comes from
// scripts/build-michelin.mjs (npm run data:michelin / data:michelin-tokyo).

const cities = {
    hk: {
        slug: 'hk',
        title: 'HK Michelin Map',
        place: 'Hong Kong',
        timeZone: 'Asia/Hong_Kong',
        timeLabel: 'HK time',
        timeLong: 'Hong Kong time',
        dataUrl: '/data/michelin-hk.json',
        defaultEdition: 'MICHELIN Guide Hong Kong & Macau 2026',
        bounds: [
            [22.15, 113.82],
            [22.57, 114.45],
        ],
        districtLabel: 'District',
    },
    tokyo: {
        slug: 'tokyo',
        title: 'Tokyo Michelin Map',
        place: 'Tokyo',
        timeZone: 'Asia/Tokyo',
        timeLabel: 'Tokyo time',
        timeLong: 'Tokyo time',
        dataUrl: '/data/michelin-tokyo.json',
        defaultEdition: 'MICHELIN Guide Tokyo',
        bounds: [
            [35.53, 139.56],
            [35.82, 139.92],
        ],
        districtLabel: 'Ward / city',
    },
}

export default cities
