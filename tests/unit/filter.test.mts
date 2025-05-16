/* eslint-disable @typescript-eslint/no-explicit-any */
import { transport } from "../../index.ts";

async function runTest() {
    try {
        const filter = transport.filter({ mainBank: '07' })

        console.log("filter response: :", await (filter as Response));
    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
