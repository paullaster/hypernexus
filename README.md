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

transport.get('/api/publisher/grouping/v1/endpoint', {'$filter' : "record eq 'recordId'"});
// A paginated get request to BC 365 ODATA API
transport.get('/api/publisher/grouping/v1/endpoint', {'$filter' : "status eq 'Review'", '$select': "name, date, status, id"}, { headers: { 'Prefer': "maxpagesize=2"}});

// A post request
transport.post('/api/publisher/grouping/v1/endpoint', { firstName: 'Paullaster', lastName: 'X', description: 'nerd', others: 'creator, mars'}, { params: {company: 'KTL'}});

// A patch and put request
transport.patch('/api/publisher/grouping/v1/endpoint', { user: 'victor', category: 'engineering', modified: true}, { params: {company: 'KTL'}, primaryKey: ['id']});

// A delete request
transport.delete('/api/publisher/grouping/v1/endpoint', {}, { params: {company: 'KTL'}, primaryKey: ['id']});

// Making a request to BC 365 ODATA functions
transport.cu('/api/publisher/grouping/v1/endpoint', { docNo: 'nodejs'}, {params: {company: 'KTL'}}); 
// For odata functions, the company option is compulsory

// Batch requests -> For multiple parallel requests.
//The utility has built-in connection pooling configured : Batch request leverages connection pooling
transport.batch([transport.get(), transport.get(), transport.get(),...kth])

// prepared BC 365 filter query from an object
 const filter = await transport.filter({
            date_from: "2022-01-01",
            date_to: '2022-01-01',
            type: "",
            priority: 2,
            status: "Completed",
    })
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

### Testing this utility

Write a simple unit test that suites your scenarios

```ts
// test/unit/test.mts
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
