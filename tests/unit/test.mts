import { transport } from "../../src/index.ts";

async function runTest() {
    try {
        const response = await transport.get("/api/KineticTechnology/CashMgt/v2.0/imprestAPI", {}, { headers: { 'Prefer': "maxpagesize=2"}}) as Response;
        console.log("Response:", await (response as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
