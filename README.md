# HYPERNEXUS

## A lightWeight, robust and easily extensible HTTP(/2,/3)/HTTPS network transport utility.

Built with :heart: using TypeScript and Node.js

## What can it do?

 Dynamically handle Window-based (NTLM, Basic, OAuth2), token-based authetication HTTP requests out of the box

Hypernexus is a developer centered util; zero boilerplate, instantly relatable methods and advnaced functionalities are also exposed for any outgoing nerds to extend the utility with ease

## Features tour

### HTTP CRUD Operations

```ts
// A get request with a filter BC 365 ODATA API

transport.get('/api/publisher/grouping/v1/endpoint', {'$filter' : "record eq 'recordId'"});
// A paginated get request to BC 365 ODATA API
transport.get('/api/publisher/grouping/v1/endpoint', {'$filter' : "status eq 'Review'", '$select': "name, date, status, id"}, { headers: { 'Prefer': "maxpagesize=2"}});

// A post request
transport.post('/api/publisher/grouping/v1/endpoint', { firstName: 'Paullaster', lastName: 'X', description: 'nerd', others: 'creator, mars'}, {company: 'KTL'});

// A patch and put request
transport.patch('/api/publisher/grouping/v1/endpoint', { user: 'victor', category: 'engineering', modified: true}, {company: 'KTL', primaryKey: ['id']});

// A delete request
transport.delete('/api/publisher/grouping/v1/endpoint', {}, {company: 'KTL', primaryKey: ['id']});

// Making a request to BC 365 ODATA functions
transport.cu('/api/publisher/grouping/v1/endpoint', { docNo: 'nodejs'}, {company: 'KTL'}); 
// For odata functions, the company option is compulsory

// Batch requests -> For multiple parallel requests.
//The utility has built-in connection pooling configured : Batch request leverages connection pooling
transport.batch([transport.get(), transport.get(), transport.get(),...kth])

```

#### What it offers

Built-in caching for redandant request
connection pooling
Performance monitoring

#### Setup this project locally

`.env` file

```js
BC_API_BASE_URL="https://domain:port/instance"
BC_AUTH_TYPE=ntlm
BC_COMPANY_NAME="CompanyName"
BC_COMPANY_ID="companyId"
BC_USERNAME="username"
BC_PASSWORD="userPassword"
BC_DOMAIN=
```

#### Testing this utility

Write a simple unit test that suites your scenarios

```ts
// integration/unit/test.mts
import { transport } from "../../index.js";

async function runTest() {
    try {
        const response = await transport.get("/api/KineticTechnology/CashMgt/v2.0/imprestAPI", {}, { headers: { 'Prefer': "maxpagesize=2"}}) as Response;
        console.log("Response:", await (response as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
```

Run your test script. You can change the file name in `package.json`
`npm run test`

#### Clone this repository

private `git clone https://github.com/kinetics254/hypernexus.git`
public `git clone https://github.com/paullaster/hypernexus.git`

#### Use this utility in your project

`npm i @brainspore/hypernexus`

##### Buy me a coffee

[Buy me a coffee](https://github.com/paullaster)
