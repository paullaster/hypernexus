/* eslint-disable @typescript-eslint/no-explicit-any */
import { transport } from "../../index.ts";

async function runTest() {
    try {
        // const response = await transport.get("/api/nurture/ESS/v1.0/companies(083db09a-ff98-f011-a7b2-6045bdacc0b6)/leaveEmployees", {}, {
        //     headers: {
        //         'Prefer': "maxpagesize=2",
        //         // 'X-Custom-Request-Company-Identifier': 'Company-Id',
        //         // 'X-Custom-Request-Company': "083db09a-ff98-f011-a7b2-6045bdacc0b6"
        //     }
        // }) as Response;
        const response = await transport.get("/api/nurture/ESS/v1.0/leaveEmployees", {}, {
            headers: {
                'Prefer': "maxpagesize=2",
                'X-Custom-Request-Company-Identifier': 'Company-Id',
                'X-Custom-Request-Company': "083db09a-ff98-f011-a7b2-6045bdacc0b6"
            }
        }) as Response;
        // const filter = await transport.filter({
        //     date_from: "2022-01-01",
        //     date_to: '2022-01-01',
        //     type: "",
        //     priority: 2,
        //     status: "Completed",
        // })

        // const updateSalaryAdance = await transport.put('/api/KineticTechnology/PayRoll/v2.0/payrollAdvance', {
        //     "applicationReason": "kvckbvc",
        //     "applicationDate": "2025-03-14",
        //     "applicationAmount": 39500,
        //     "no": 'SADV000',
        // },
        //     {
        //         params: {
        //             compan: process.env.BC_COMPANY_NAME
        //         },
        //         primaryKey: ['no']
        //     } as Record<string, any>
        // )
        console.log("Updated Salary advance: :", await (response as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
