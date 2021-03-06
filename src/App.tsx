import {
  coinConvert,
  getChainId,
  getKeplr,
  viewingKeyManager,
} from "@stakeordie/griptape.js";
import "semantic-ui-css/semantic.min.css";
import React, { useEffect } from "react";
import "./App.css";
import {
  setEstimatingFromA,
  setEstimatingFromB,
  setFrom,
  setTo,
  setSelectedFrom,
  setSelectedTo,
  setSelectedPair,
  updateContract,
  useSwap,
  setLoading,
} from "./context";
import { compute_swap, humanizeBalance } from "./utils";
import BigNumber from "bignumber.js";
import { FromToken, Loading, SubmitButton, ToToken } from "./components";
import { DefaultLayout } from "./layouts";

function App() {
  const { swapDispatch, swapState } = useSwap();
  const {
    contracts,
    pairs,
    selectedFrom,
    selectedTo,
    from,
    to,
    estimatingFromA,
    estimatingFromB,
    selectedPair,
    loading,
  } = swapState;

  async function onSelectChange(e: any, type: "From" | "To"): Promise<void> {
    const contract = contracts.find(
      ({ contract }) => contract.at === e.target.value
    );
    if (!contract) return;
    let selectedPair;

    if (type === "From") {
      setSelectedFrom(swapDispatch, contract);
      if (!selectedTo.token) return;
      selectedPair =
        pairs[`${contract.token.address}-${selectedTo.token.address}`] ||
        pairs[`${selectedTo.token.address}-${contract.token.address}`];
    } else if (type === "To") {
      setSelectedTo(swapDispatch, contract);
      if (!selectedFrom.token) return;
      selectedPair =
        pairs[`${selectedFrom.token.address}-${contract.token.address}`] ||
        pairs[`${contract.token.address}-${selectedFrom.token.address}`];
    }

    if (selectedPair) {
      const pool = await selectedPair.contract.getPool();
      const pair = { ...selectedPair, pool };
      setSelectedPair(swapDispatch, pair);
    } else {
      setSelectedPair(swapDispatch, {});
    }
  }

  async function onSubmit(e: any) {
    setLoading(swapDispatch, true);
    e.preventDefault();
    if (
      !from ||
      !to ||
      !selectedFrom.contract ||
      !selectedTo.contract ||
      !selectedPair
    ) {
      alert("Missing fields");
      return;
    }
    const amount = coinConvert(from, selectedFrom.token.decimals, "machine");
    const expected_return = coinConvert(
      to,
      selectedFrom.token.decimals,
      "machine"
    );
    const msg = btoa(
      JSON.stringify({
        swap: {
          expected_return,
        },
      })
    );
    try {
      const res = await selectedFrom.contract.send(
        selectedPair.contract.at,
        amount,
        msg
      );
      if (res) {
        const tokenA = await updateContract(
          swapDispatch,
          swapState,
          selectedFrom.token.address
        );
        const tokenB = await updateContract(
          swapDispatch,
          swapState,
          selectedTo.token.address
        );
        setSelectedFrom(swapDispatch, tokenA);
        setSelectedTo(swapDispatch, tokenB);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(swapDispatch, false);
    }
  }

  async function createViewingKey(
    address: string,
    contract: Record<string, any>,
    type: "From" | "To"
  ) {
    try {
      const keplr = await getKeplr();
      const chain = await getChainId();
      await keplr.suggestToken(chain, address);
      const vk = await keplr.getSecret20ViewingKey(chain, address);
      viewingKeyManager.add(contract, vk);
      await updateContractStore(type, address);
    } catch (error) {
      console.error(error);
    }
  }

  async function updateContractStore(type: "From" | "To", address: string) {
    try {
      const res = await updateContract(swapDispatch, swapState, address);
      type === "From"
        ? setSelectedFrom(swapDispatch, res)
        : setSelectedTo(swapDispatch, res);
    } catch (error) {
      return;
    }
  }

  function onInputChange(e: any, type: "From" | "To") {
    if (type === "From") {
      setEstimatingFromA(swapDispatch);
      setFrom(swapDispatch, e.target.value);
    } else {
      setEstimatingFromB(swapDispatch);
      setTo(swapDispatch, e.target.value);
    }
  }

  useEffect(() => {
    (async () => {
      if (
        !selectedFrom.contract ||
        !selectedTo.contract ||
        !selectedPair.contract
      )
        return;
      try {
        if (estimatingFromA && from) {
          const amount = coinConvert(
            from,
            selectedFrom.token.decimals,
            "machine"
          );
          const { pool } = selectedPair;
          const { amount: offer_pool } = pool.assets.find(
            (e: any) => e.info.token.contract_addr === selectedFrom.contract.at
          );
          const { amount: ask_pool } = pool.assets.find(
            (e: any) => e.info.token.contract_addr === selectedTo.contract.at
          );
          const offer_pool_final = humanizeBalance(
            new BigNumber(offer_pool),
            selectedFrom.token.decimals
          );
          const ask_pool_final = humanizeBalance(
            new BigNumber(ask_pool),
            selectedTo.token.decimals
          );
          const { return_amount, commission_amount } = compute_swap(
            offer_pool_final,
            ask_pool_final,
            new BigNumber(amount)
          );
          if (return_amount) {
            const expected_return = parseFloat(
              coinConvert(
                commission_amount.toNumber(),
                selectedFrom.token.decimals,
                "human"
              )
            ).toFixed(selectedFrom.token.decimals);
            setTo(swapDispatch, expected_return);
          }
        } else if (estimatingFromB && to) {
          //Query reverse
        }
      } catch (error) {}
    })();
  }, [
    from,
    selectedFrom,
    selectedTo,
    selectedPair,
    swapDispatch,
    to,
    estimatingFromA,
    estimatingFromB,
  ]);

  return (
    <>
      <Loading loading={loading} />
      <DefaultLayout>
        <h1>Swap</h1>
        <form onSubmit={onSubmit} className="swap-form">
          <FromToken
            from={from}
            contracts={contracts}
            selectedFrom={selectedFrom}
            createViewingKey={createViewingKey}
            onSelectChange={onSelectChange}
            onInputChange={onInputChange}
          />
          <ToToken
            to={to}
            contracts={contracts}
            selectedTo={selectedTo}
            createViewingKey={createViewingKey}
            onSelectChange={onSelectChange}
            onInputChange={onInputChange}
          />
          <SubmitButton
            from={from}
            to={to}
            selectedFrom={selectedFrom}
            selectedTo={selectedTo}
            selectedPair={selectedPair}
          />
        </form>
      </DefaultLayout>
    </>
  );
}

export default App;
