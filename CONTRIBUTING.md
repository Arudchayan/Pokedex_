# Contributing

## Development Setup

1. Install Node.js 20.x and npm 10.x.
2. Install dependencies:
   `npm ci`
3. Run the app:
   `npm run dev`

## Before Opening a PR

Run the project checks locally:
`npm run check`

If end-to-end tests are changed, run:
`npx playwright install --with-deps && npx playwright test`

## Branch and Commit Guidelines

- Use feature branches from `master`.
- Keep PRs focused and small.
- Include tests for behavior changes.

## Pull Request Requirements

- Clear problem statement
- Summary of technical approach
- Test evidence
- Screenshots for UI changes

## Security

If you discover a vulnerability, follow `SECURITY.md` and report privately.
