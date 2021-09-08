import BigNumber from "bignumber.js";
// Commission rate == 0.3%
export const COMMISSION_RATE = 0.3 / 100;

// To reduce unnecessary queries, compute_swap is ported from here
//https://github.com/enigmampc/SecretSwap/blob/6135f0ad74a17cefacf4ac0e48497983b88dae91/contracts/secretswap_pair/src/contract.rs#L616-L636

export const compute_swap = (
  offer_pool: BigNumber,
  ask_pool: BigNumber,
  offer_amount: BigNumber
): {
  return_amount: BigNumber;
  spread_amount: BigNumber;
  commission_amount: BigNumber;
} => {
  // offer => ask
  // ask_amount = (ask_pool - cp / (offer_pool + offer_amount)) * (1 - commission_rate)
  const cp = offer_pool.multipliedBy(ask_pool);
  let return_amount = ask_pool.minus(
    cp.multipliedBy(new BigNumber(1).dividedBy(offer_pool.plus(offer_amount)))
  );

  // calculate spread & commission
  const spread_amount = offer_amount
    .multipliedBy(ask_pool.dividedBy(offer_pool))
    .minus(return_amount);
  const commission_amount = return_amount.multipliedBy(COMMISSION_RATE);

  // commission will be absorbed to pool
  return_amount = return_amount.minus(commission_amount);

  return { return_amount, spread_amount, commission_amount };
};

export const humanizeBalance = (
  balance: BigNumber,
  decimals: number
): BigNumber => {
  try {
    return balance.dividedBy(new BigNumber(`1e${decimals}`));
  } catch (error) {
    console.error(error);
    return new BigNumber(0);
  }
};
