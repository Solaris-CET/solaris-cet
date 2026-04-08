import { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
    lang: "tact",
    target: "contracts/Oracle.tact",
    options: {
        debug: false,
    },
};

