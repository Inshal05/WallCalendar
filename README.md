# Wall Calendar

React + Vite app for the wall calendar project.

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run holidays:sync` refreshes the holiday dataset.
- `npm run firebase:login` opens Firebase CLI login.
- `npm run firebase:deploy` deploys Firebase Hosting.

## Firebase Hosting

This repo is configured for Firebase Hosting as a single-page app:

- Production files are deployed from `dist/`
- All routes rewrite to `index.html`

### First-time setup

1. Run `npm run build`
2. Run `npx firebase-tools login`
3. Run `npx firebase-tools use --add`
4. Choose or create your Firebase project
5. Run `npm run firebase:deploy`

If you want to save the selected Firebase project in the repo, create a `.firebaserc` file after linking the project. It is currently ignored so local project IDs do not get committed by accident.
