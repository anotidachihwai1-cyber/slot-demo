# Publish the SLOT demo on GitHub Pages

This workflow publishes a demo with sample businesses and browser-local bookings. It deliberately writes an empty Supabase config into the published artifact. No sign-in, real bookings or payments are enabled. Keep the commercial marketplace on a host whose terms permit it: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

1. Create a repository named `slot-demo` on GitHub. For free Pages hosting, use a public repository. Upload the contents of this `slot` folder at the repository root, including `.github/workflows/pages.yml` and `tests/`.
2. In repository Settings → Pages, set Source to GitHub Actions.
3. Push to `main` (or open Actions → Deploy SLOT demo to GitHub Pages → Run workflow).
4. Wait for the workflow to finish. Use the deployment URL shown by the workflow rather than guessing it.

Only the six frontend files and `.nojekyll` are published as website assets. SQL, tests, README and server files are not served by Pages. Files committed to a public repository are still publicly visible as source.

The workflow expects `index.html` at the repository root, not under `outputs/slot`. Relative asset links already support a repository subpath such as `/slot-demo/`.
