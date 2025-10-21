/* eslint-disable @typescript-eslint/no-explicit-any */
import { transport } from "../../index.ts";

async function runTest() {
    try {
        // const response = await transport.get("/api/KineticTechnology/CashMgt/v2.0/imprestAPI", {}, { headers: { 'Prefer': "maxpagesize=2"}}) as Response;
        // const filter = await transport.filter({
        //     date_from: "2022-01-01",
        //     date_to: '2022-01-01',
        //     type: "",
        //     priority: 2,
        //     status: "Completed",
        // })

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
