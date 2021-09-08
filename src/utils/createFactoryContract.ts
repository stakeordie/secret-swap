import {
  createContract,
  snip20Def,
  extendContract,
} from "@stakeordie/griptape.js";
const def = {
  queries: {
    getPairs() {
      return { pairs: { limit: 1000 } };
    },
  },
};
function createFactoryContract(id: string, address: string) {
  return createContract({
    id: id,
    at: address,
    definition: extendContract(snip20Def, def),
  });
}

export default createFactoryContract;
