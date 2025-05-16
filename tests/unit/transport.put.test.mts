/* eslint-disable @typescript-eslint/no-explicit-any */
import { transport } from "../../index.ts";

async function runTest() {
    try {

        const updateSalaryAdance = await transport.put('/api/KineticTechnology/PayRoll/v2.0/payrollAdvance', {
            "applicationReason": "kvckbvc",
            "applicationDate": "2025-03-14",
            "applicationAmount": 39500,
            "no": 'SADV000',
        },
            {
                params: {
                    compan: process.env.BC_COMPANY_NAME
                },
                primaryKey: ['no']
            } as Record<string, any>
        )
        console.log("Updated Salary advance: :", await (updateSalaryAdance as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
