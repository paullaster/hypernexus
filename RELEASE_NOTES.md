# Release Notes

Summary

- Added a committed `.env.example` demonstrating every environment variable used by the project.
- Improved README configuration section to explicitly document authentication options and OAuth2 client-credentials flow.
- Clarified Redis defaults and token endpoint generation.

Important details

- OAuth2: When using `oauth2`, ensure the following are configured and granted appropriate permissions in Azure AD:
  - MICROSOFT_TENANT_ID
  - MICROSOFT_DYNAMICS_SAS_CLIENT_ID
  - MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET
  - MICROSOFT_DYNAMICS_SAS_SCOPE (defaults to https://api.businesscentral.dynamics.com/.default)
    Access token URL is generated as: https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token

Upgrade / release checklist

1. Copy `.env.example` to `.env` and fill in secrets (do NOT commit `.env`).
2. Verify `BC_USERNAME` and `BC_PASSWORD` are present. If you rely purely on oauth2 these are.
3. Run tests and smoke-check connector flows (ntlm/basic/oauth2) against a staging BC instance.
4. Tag the release (suggested format): vX.Y.Z (semantic versioning). Example:
   - git tag -a v1.2.0 -m "chore(config): env/docs update"
   - git push origin v1.2.0

Suggested release title and short description

- Title: Configuration & docs: add .env.example and document oauth2
- Description: Adds a comprehensive `.env.example` and documents environment variables and OAuth2 client-credentials usage in README. Notes BC_INTANCE naming and Redis defaults.

Changelog entry (for release notes)

- See CHANGELOG.md (Unreleased) entry included in this commit.
