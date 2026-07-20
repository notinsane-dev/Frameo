# Security Policy

## Reporting a vulnerability

If you find a security issue in Frameo, please report it privately instead of opening a public GitHub issue.

Email: **privacy@frameo.app**

Include:

- A short description of the issue
- Steps to reproduce
- Impact (e.g. auth bypass, data exposure)
- Your preferred contact method

We will acknowledge reports as soon as we can and work on a fix before any public disclosure.

## Safe handling of secrets

- Never commit `.env`, `.env.local`, or real API keys
- Use `.env.example` as the template only
- Rotate keys if they may have been exposed
