import { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
    lang: "tact",
    target: "contracts/R2ATaskBoard.tact",
    options: {
        debug: false,
    },
};

