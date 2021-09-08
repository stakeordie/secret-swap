import {
  createContract,
  snip20Def,
  extendContract,
  Context,
} from "@stakeordie/griptape.js";
const def = {
  queries: {
    simulate(
      _: Context,
      contract_addr: string,
      token_code_hash: string,
      amount: string
    ) {
      return {
        simulation: {
          offer_asset: {
            amount,
            info: {
              token: { contract_addr, token_code_hash, viewing_key: "" },
            },
          },
        },
      };
    },
  },
};
function createPairContract(id: string, address: string) {
  return createContract({
    id: id,
    at: address,
    definition: extendContract(snip20Def, def),
  });
}

export default createPairContract;
