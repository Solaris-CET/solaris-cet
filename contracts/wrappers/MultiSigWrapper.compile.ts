import { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
    lang: "tact",
    target: "contracts/MultiSigWrapper.tact",
    options: {
        debug: true,
    },
};
