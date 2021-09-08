import { createContract, snip20Def } from "@stakeordie/griptape.js";

function createSnip20(id: string, address: string) {
  return createContract({
    id: id,
    at: address,
    definition: snip20Def,
  });
}

export default createSnip20;
