import { transport } from "../../index.ts";

async function runTest() {
    try {
        // const response = await transport.get("/api/KineticTechnology/CashMgt/v2.0/imprestAPI", {}, { headers: { 'Prefer': "maxpagesize=2"}}) as Response;
        const filter = await transport.filter({
            date_from: "2022-01-01",
            date_to: "2022-12-31",
            type: "Task",
            priority: 2,
            status: "Completed",
        })
        console.log("Response:", (filter as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
