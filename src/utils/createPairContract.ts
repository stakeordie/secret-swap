import {
  createContract,
  snip20Def,
  extendContract,
} from "@stakeordie/griptape.js";
const def = {
  queries: {
    getPool() {
      return { pool: {} };
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
