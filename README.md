# HYPERNEXUS

A lightWeight, robust and easily extensible HTTP(/2,/3)/HTTPS network transport utility

Built with :heart: using TypeScript and Node.js

## What can it do?

Dynamically handle Window-based (NTLM, Basic, OAuth2), token-based authetication HTTP requests out of the box

Hypernexus is a developer centered util; zero boilerplate, instantly relatable methods and advanced functionalities are also exposed for any outgoing nerd to extend the utility with ease

## Features tour

HTTP CRUD Operations

```ts
// A get request with a filter BC 365 ODATA API

transport.get("/api/publisher/grouping/v1/endpoint", {
  $filter: "record eq 'recordId'"
});
// A paginated get request to BC 365 ODATA API
transport.get(
  "/api/publisher/grouping/v1/endpoint",
  { $filter: "status eq 'Review'", $select: "name, date, status, id" },
  { headers: { Prefer: "maxpagesize=2" } }
);

// A post request
transport.post(
  "/api/publisher/grouping/v1/endpoint",
  {
    firstName: "Paullaster",
    lastName: "X",
    description: "nerd",
    others: "creator, mars"
  },
  { params: { company: "KTL" } }
);

// A patch and put request
transport.patch(
  "/api/publisher/grouping/v1/endpoint",
  { user: "victor", category: "engineering", modified: true },
  { params: { company: "KTL" }, primaryKey: ["id"] }
);

// A delete request
transport.delete(
  "/api/publisher/grouping/v1/endpoint",
  {},
  { params: { company: "KTL" }, primaryKey: ["id"] }
);

// Making a request to BC 365 ODATA functions
transport.cu(
  "/api/publisher/grouping/v1/endpoint",
  { docNo: "nodejs" },
  { params: { company: "KTL" } }
);
// For odata functions, the company option is compulsory

// Batch requests -> For multiple parallel requests.
//The utility has built-in connection pooling configured : Batch request leverages connection pooling
transport.batch([transport.get(), transport.get(), transport.get(), ...kth]);

// prepared BC 365 filter query from an object
const filter = await transport.filter({
  date_from: "2022-01-01",
  date_to: "2022-01-01",
  type: "",
  priority: 2,
  status: "Completed"
});
//response: {'$filter': "date_from eq 2022-01-01 and date_to eq 2022-01-01 and priority eq 2 and status eq 'Completed'"}

//NOTE!
//Errors resulting from the request are progated back as object values for the developer to handle.
// Example error response body:
//{
//error: {
//  code: 'BadRequest_ResourceNotFound',
//  message: "Resource not found for the segment 'payrollAdvance'.  CorrelationId:  7fbe0bac-b30b-4c26-aa52-653622f9cce2."
// }
//}
```

## What it offers

Built-in caching for redandant request
connection pooling
Performance monitoring

### Setup this project locally

### Configuration (Environment variables)

`.env` file

```js
APP_LOG_CHANNEL='daily'
LOG_LEVEL='debug'

BC_API_BASE_URL="https://domain:port/instance"
BC_AUTH_TYPE=ntlm
BC_COMPANY_NAME="CompanyName"
BC_COMPANY_ID="companyId"
BC_USERNAME="username"
BC_PASSWORD="userPassword"
BC_DOMAIN=


REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_USERNAME=
REDIS_PASSWORD=


MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_DYNAMICS_SAS_CLIENT_ID=your-client-id
MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET=your-client-secret
MICROSOFT_DYNAMICS_SAS_GRANT_TYPE=client_credentials
MICROSOFT_DYNAMICS_SAS_SCOPE=https://api.businesscentral.dynamics.com/.default
```

This project reads configuration from environment variables (via dotenv). A complete example is included in `.env.example` at the package root. Copy `.env.example` to `.env` and fill in real values.

Important environment variables (consumed by src/config/env.ts):

- BC_API_BASE_URL (optional)
  - Base URL for Business Central API (default in code: `https://<your-domain>`).
- MICROSOFT_TENANT_ID
  - Tenant id used when constructing the Microsoft token endpoint.
- BC_AUTH_TYPE (required)
  - Allowed values: `ntlm`, `basic`, `oauth2`.
  - Selects authentication flow used by the library.

Credentials:

- BC_USERNAME and BC_PASSWORD (required by code)
  - The app throws on startup if these are empty. They are used for NTLM/basic flows.
  - Note: current code requires these fields to be present even when `oauth2` is selected.
- BC_DOMAIN
  - Optional, used for NTLM.

OAuth2 (when BC_AUTH_TYPE=oauth2)

- Required vars for oauth2:
  - MICROSOFT_TENANT_ID
  - MICROSOFT_DYNAMICS_SAS_CLIENT_ID
  - MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET
  - MICROSOFT_DYNAMICS_SAS_GRANT_TYPE (default: client_credentials)
  - MICROSOFT_DYNAMICS_SAS_SCOPE (default: https://api.businesscentral.dynamics.com/.default)
- The runtime token endpoint constructed by the app:
  - https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token
- Behavior & requirements:

  - The library will use the client credentials flow to obtain an access token for Business Central.
  - Ensure your Azure AD application has the Application permission to access Business Central and consented scopes matching the configured `MICROSOFT_DYNAMICS_SAS_SCOPE`.
  - Even when using OAuth2, BC_USERNAME and BC_PASSWORD must be present in the current code (they may be required by other parts or for fallbacks). Consider updating code if you want to make credentials optional for pure oauth2 flows.

  - For OAuth2 redis must be installed.
    Redis (optional)

- REDIS_HOST (default 127.0.0.1)
- REDIS_PORT (default 6379)
- REDIS_DB (default 0)
- REDIS_USERNAME / REDIS_PASSWORD (optional)

Quick setup

1. cp .env.example .env
2. Fill in required values (do not commit `.env`).
3. Ensure BC_USERNAME and BC_PASSWORD are set (the code will throw if missing).
4. If using `oauth2`, set MICROSOFT\_\* client credentials and MICROSOFT_TENANT_ID and ensure the Azure AD app has the correct permissions.
5. Start the application.

Notes

- Do not rename `BC_INTANCE` in your .env unless you also update the source code.
- `BC_AUTH_TYPE` must be one of `ntlm`, `basic`, or `oauth2`.
- The `.env.example` in the package root shows sample values and required keys.

### Testing this utility

Write a simple unit test that suites your scenarios

```ts
// test/unit/test.mts
import { transport } from "../../index.js";

async function runTest() {
  try {
    const response = (await transport.get(
      "/api/KineticTechnology/CashMgt/v2.0/imprestAPI",
      {},
      { headers: { Prefer: "maxpagesize=2" } }
    )) as Response;
    console.log("Response:", await (response as Response));
  } catch (error) {
    console.error("Error:", error);
  }
}

runTest();
```

Run your test script. You can change the file name in `package.json`

Then run

`npm run test`

### Clone this repository

private `git clone https://github.com/kinetics254/hypernexus.git`

public `git clone https://github.com/paullaster/hypernexus.git`

### Use this utility in your project

`npm i @brainspore/hypernexus`

### Documentation

[Read more here :books:](https://paullaster.github.io/hypernexus)

Buy me a coffee

[:coffee:](https://github.com/paullaster)
