# Release and rollback

GitHub Pages publishes the production Vite output. The Test and deploy workflow runs unit tests, TypeScript/build and Chromium end-to-end checks before deployment. Pull requests run verification without publishing.

After a release, verify the welcome dialog on a fresh visit, a saved name after reload, the brain-dump/review/save path, settings and static assets at the repository subpath. Optional model downloads are tested separately and should remain opt-in.

For a regression, revert the responsible commit on main and let the same workflow redeploy. Browser service workers show an update prompt; users should save reviewed steps and pause timers before reloading. Do not clear site storage as a deployment workaround: it contains local user data.

No analytics or remote error reporting is installed. Reproduce reported problems with fictional notes, inspect browser errors locally and add a focused regression test. Do not ask users to post private recordings or personal exports in issues.
