# animeshharsh.com

Personal site (Create React App), deployed to GitHub Pages with `npm run deploy`.

## Utilities

Listed on `/utilities` from `src/data/utilities.js`. See that file for how to add one.

### HK Water Fountains (`/utilities/hk-water-fountains`)

Map of LCSD drinking fountains. The page loads `public/data/fountains.json`, which is generated from
the LCSD CSV by `scripts/build-fountains.mjs`.

To update the data:

1. Download the English CSV from DATA.GOV.HK
   (https://data.gov.hk/en-data/dataset/hk-lcsd-facwd-fac-wd-list) and save it as `data/lcsd_wd_en.csv`.
2. `npm run data:fountains -- --source-date YYYY-MM-DD` (the date shown on the page as "Data as of").
3. Read `data/fountains-report.md` for excluded and flagged rows. Fix positions in
   `data/fountain-overrides.json`, then re-run step 2.
4. `npm run deploy`.

### HK Michelin Map (`/utilities/hk-michelin`)

Hong Kong restaurants with MICHELIN stars or a Bib Gourmand. The list lives in
`data/michelin_hk_2026.csv`, compiled from published coverage of the guide announcement, with OpenStreetMap
coordinates. `scripts/build-michelin.mjs` validates it, writes `public/data/michelin-hk.json` and publishes a
copy of the CSV for download.

- Fix a row: edit the CSV, or add an entry in `data/michelin-overrides.json` (e.g. `"exclude": true` if a
  restaurant closes, or corrected `lat`/`lng`).
- Each row also has a `description` (our own words) and `hours` in a strict format the build checks, e.g.
  `Mon-Fri 12:00-14:30, 18:00-22:30; Sat-Sun 11:30-15:00; Tue closed` (times past midnight like `18:00-02:00`).
  The page uses it for the weekly table, the "Open now" badge and filter (local city time).
- New guide edition: save a new CSV with the same columns, point the city's `csv`/`edition` at it in
  `scripts/build-michelin.mjs`, then rebuild.
- Check `data/michelin-report.md`, then `npm run deploy`.

### Tokyo Michelin Map (`/utilities/tokyo-michelin`)

Same page and build script, Tokyo settings (`src/components/Michelin/cities.js`). Data:
`data/michelin_tokyo.csv` (MICHELIN Guide Tokyo 2026, coordinates from the GSI geocoder / Tabelog pins, hours
mostly from Tabelog), fixes in `data/michelin-tokyo-overrides.json`. Rebuild with `npm run data:michelin-tokyo`;
report in `data/michelin-tokyo-report.md`. The 2027 Tokyo selection is due 16 Feb 2027.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
