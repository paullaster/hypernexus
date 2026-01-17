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

##### Built-in caching for redandant request

Setting cache

```ts


/**
*
*Instruct a get request to cache response for successive get request
*
*/

transport.get('endpoint', params, {useCache: true, ...});

/**
*
* By default cacheTTL is set to 300.
* You can modify this with you custom request config
*
*/

transport.get('endpoint', params, {useCache: true, cacheTTL: 600, ...});

/**
*
* Clear cache specific cache like
*
*/
transport.clearCache('endpoint', params, {...});  // - you can specify company in the third argument option


/**
*
* Flush the entire cache
*
*/
transport.clearAllCaches();

```

##### Connection Pooling

##### Performance monitoring

##### Request Context Company

You can leverage request context company config per request by adding two special headers. These headers let you override the package-level company settings (from env or global config) only for that single outgoing request — the global configuration is not mutated.

Header names (exact strings)

- X-Custom-Request-Company-Identifier
- X-Custom-Request-Company

Identifier values supported (case-sensitive strings as shown)

- Company-Name -> the human/company name used in your environment (e.g. "KTL")
- Company-Id -> the company GUID or id (e.g. "083db09a-ff98-f011-a7b2-6045bdacc0b6")
- Url-Complete -> a full/partial URL or path segment when your API requires a complete URL override

Behavior & precedence

- If these headers are present on a request the middleware (see src/interfaces/middleware/ModifyRequestCompanyInformation.ts) will use them to construct/override the company-related information for that request.
- Headers take precedence over:
  - the global env/config values (BC_COMPANY_NAME, BC_COMPANY_ID, BC_COMPANY_USE)
  - request params.company when the middleware requires a header-form override
- The override is scoped to the single request and does not change global configuration or subsequent requests.

Examples

1. Override by Company-Id (common case)

```ts
// override using company GUID
const response = (await transport.get(
  "/api/publisher/group/v1.0/leaveEmployees",
  {},
  {
    headers: {
      Prefer: "maxpagesize=2",
      "X-Custom-Request-Company-Identifier": "Company-Id",
      "X-Custom-Request-Company": "company-id"
    }
  }
)) as Response;
```

2. Override by Company-Name

```ts
// override using company name
const response = await transport.post(
  "/api/publisher/grouping/v1/endpoint",
  {
    /* body */
  },
  {
    headers: {
      "X-Custom-Request-Company-Identifier": "Company-Name",
      "X-Custom-Request-Company": "KTL"
    }
  }
);
```

3. Override by Url-Complete

```ts
// when the API expects a full/complete company URL segment
const response = await transport.get(
  "/api/some/endpoint",
  {},
  {
    headers: {
      "X-Custom-Request-Company-Identifier": "Url-Complete"
    }
  }
);
```

Alternative: params-based company (existing approach)

- You can still use the params object when appropriate:

```ts
transport.get("/api/endpoint", {}, { params: { company: "KTL" } });
```

- Use the header approach when you need a per-request override that the middleware will transform consistently.

Implementation reference

- See src/interfaces/middleware/ModifyRequestCompanyInformation.ts for the exact runtime behavior and how header values are applied to the outgoing request.

##### OData Count Query Middleware

This middleware enables efficient counting of OData entities without retrieving the actual data, leveraging Microsoft OData 365's `$count` query parameter. It allows users to return only the count of matching records, leaving the `value` array empty, which is particularly useful for performance-critical scenarios where you only need the total number of items.

###### How It Works

The `ReturnCountOnlyWithODataCountQuery` middleware (see src/interfaces/middleware/ReturnCountOnlyWithODataCountQuery.ts) intercepts outgoing requests and checks for a custom `count` header. If the header is present and set to `true` (case-insensitive), it automatically appends `/$count` to the request URL. This transforms the request into an OData count query, instructing the server to return only the count of matching entities instead of the full dataset.

###### Usage with the Count Header

To use this middleware, simply add the `count` header to your request configuration:

```ts
// Using the count header to get only the count
const response = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  { $filter: "status eq 'Active'" },
  {
    headers: {
      "count": "true"
    }
  }
);

// Response will be a number representing the count, e.g., 42
console.log(response); // 42
```

The middleware handles case-insensitive header values (`count`, `Count`, etc.) and accepts both string and boolean values.

###### Combining with Other Options

You can combine the `count` header with other OData query options for more precise counting:

```ts
// Count with filtering and additional query parameters
const response = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  {
    $filter: "status eq 'Active' and date gt 2023-01-01T00:00:00Z",
    $select: "id,name"  // Even with $select, only count is returned
  },
  {
    headers: {
      "count": "true",
      "Prefer": "maxpagesize=1000"  // Other headers work normally
    }
  }
);
```

Note that when using the `count` header, other query parameters like `$select`, `$expand`, etc., are still sent to the server but the response will only contain the count.

###### Alternative: Manual Query Parameters (Without Middleware)

If you prefer not to use the `count` header, you can achieve the same result by manually adding `$count=true` to your query parameters and setting `$top=0` to ensure no actual data rows are returned:

```ts
// Manual approach using query parameters
const response = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  {
    $filter: "status eq 'Active'",
    $count: "true",  // Explicitly request count
    $top: "0"        // Ensure no data rows are returned
  }
);

// Response structure: { "@odata.count": 42, "value": [] }
console.log(response); // { "@odata.count": 42, "value": [] }
```

This alternative gives you more control but requires manual parameter management.

###### Value and Benefits

Using the count functionality provides several advantages:

1. **Performance**: Significantly reduces response size and processing time by avoiding data transfer.
2. **Bandwidth Efficiency**: Ideal for mobile applications or limited bandwidth scenarios.
3. **Quick Validation**: Quickly check if records exist without fetching them.
4. **Pagination Support**: Combine with filtering to get accurate counts for paginated datasets.

Compared to fetching full datasets and checking `response.value.length`, this approach:
- Reduces server load and response time
- Minimizes network traffic
- Provides accurate counts even with large datasets
- Works consistently across different OData implementations

###### Complete Example Comparison

```ts
// Scenario: Check how many active users exist

// Method 1: Using count header (recommended)
const countOnly = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  { $filter: "status eq 'Active'" },
  { headers: { "count": "true" } }
);
console.log(`Active users count: ${countOnly}`); // Active users count: 42

// Method 2: Manual query parameters
const fullResponse = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  {
    $filter: "status eq 'Active'",
    $count: "true",
    $top: "0"
  }
);
console.log(`Active users count: ${fullResponse['@odata.count']}`); // Active users count: 42

// Method 3: Traditional approach (less efficient)
const traditional = await transport.get(
  "/api/publisher/grouping/v1/endpoint",
  { $filter: "status eq 'Active'" }
);
console.log(`Active users count: ${traditional.value.length}`); // Active users count: 42
// But this transfers all user data unnecessarily!
```

The middleware approach (Method 1) is the most efficient and clean, while Method 2 provides the same result without middleware dependency.

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
BC_COMPANY_USE='Company-Name' // Default value is: Company-Name, other possible Values are : Company-Id, Url-Complete
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

- BC_USERNAME and BC_PASSWORD
  - They are required for NTLM/basic flows.
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
