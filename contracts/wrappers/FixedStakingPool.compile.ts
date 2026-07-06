import { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
    lang: "tact",
    target: "contracts/FixedStakingPool.tact",
    options: {
        debug: false,
    },
};

