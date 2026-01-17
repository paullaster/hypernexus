/* eslint-disable @typescript-eslint/no-explicit-any */
import { transport } from "../../index.ts";

async function runTest() {
    try {
        const response = await transport.get("/api/nurture/voyager/v1.0/approvalEntries", {
            $filter: `status eq 'Open'`
        }, { headers: { 'count': true, 'Prefer': "maxpagesize=1000" } }) as Response;

        console.log("Updated Salary advance: :", await (response as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
