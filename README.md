# Helix

Helix is a scientific research workspace that uses local scientific explanations and live searches of public scholarly indexes. It does not call OpenAI, Gemini, Claude, or any other commercial AI provider.

## Start

Run `npm start`, then open `http://localhost:3000`.

Helix searches scholarly metadata live, displays direct DOI evidence links, keeps recent research in the browser, and adds a local answer when it has relevant built-in knowledge. Search terms are sent to OpenAlex and Crossref when you submit a question.

## Google Sign-In

Add a Google Web OAuth client ID to `config.js` to enable the Google sign-in button. In the Google Cloud Console, add `http://localhost:3000` and your future production domain to **Authorized JavaScript origins**. The Google profile shown by this demo is held only in the browser; production accounts need server-side token verification and a database.

## Hosting online

The server listens on all network interfaces and includes a `Dockerfile`, so it is ready to deploy to a hosting provider. Public deployment needs a hosting account and a provider you choose. Before making it public, add rate limits, abuse controls, server-side identity verification, persistent storage, and a privacy policy.

## Notes

- Helix's interface and chat history run locally; live research queries go to OpenAlex and Crossref.
- A general-purpose language model such as ChatGPT is created by training neural-network weights on massive datasets. This requires a training pipeline, legal data rights, specialized hardware, and substantial compute—it cannot be produced from a website alone.
- Validate important health, legal, financial, and safety information with qualified sources.
