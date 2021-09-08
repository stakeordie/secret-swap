import {
  coinConvert,
  getChainId,
  getKeplr,
  viewingKeyManager,
} from "@stakeordie/griptape.js";
import "semantic-ui-css/semantic.min.css";
import React, { useEffect } from "react";
import { Dimmer, Loader } from "semantic-ui-react";
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
import { compute_swap } from "./utils";
import BigNumber from "bignumber.js";
import { humanizeBalance } from "./utils/computeSwap";

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
    <div className="App">
      {loading && (
        <Dimmer active>
          <Loader className="center" size="massive">
            Loading
          </Loader>
        </Dimmer>
      )}
      <h1>Swap</h1>
      <form onSubmit={onSubmit} className="form">
        <h3> From </h3>
        <label htmlFor="">
          {selectedFrom.contract ? (
            selectedFrom?.token?.balance ? (
              `Balance: ${selectedFrom?.token?.balance}`
            ) : (
              <button
                type="button"
                onClick={() =>
                  createViewingKey(
                    selectedFrom.token.address,
                    selectedFrom.contract,
                    "From"
                  )
                }
              >
                Create Viewing Key
              </button>
            )
          ) : (
            "Balance: 0"
          )}
        </label>
        <select name="select-from" onChange={(e) => onSelectChange(e, "From")}>
          <option value="" />
          {contracts.map(({ token }, i) => (
            <option key={`From-${i}`} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <input
          value={from}
          type="number"
          placeholder="0"
          onChange={(e) => {
            setEstimatingFromA(swapDispatch);
            setFrom(swapDispatch, e.target.value);
          }}
        />

        <h3> To </h3>
        <label htmlFor="">
          {selectedTo.contract ? (
            selectedTo?.token?.balance ? (
              `Balance: ${selectedTo?.token?.balance}`
            ) : (
              <button
                type="button"
                onClick={() =>
                  createViewingKey(
                    selectedTo.token.address,
                    selectedTo.contract,
                    "To"
                  )
                }
              >
                Create Viewing Key
              </button>
            )
          ) : (
            "Balance: 0"
          )}
        </label>
        <select name="select-to" onChange={(e) => onSelectChange(e, "To")}>
          <option value="" />
          {contracts.map(({ token }, i) => (
            <option key={`To-${i}`} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <input
          value={to}
          type="number"
          placeholder="0"
          onChange={(e) => {
            setEstimatingFromB(swapDispatch);
            setTo(swapDispatch, e.target.value);
          }}
        />

        <button
          type="submit"
          disabled={
            !from || !to || !selectedFrom.contract || !selectedTo.contract
          }
        >
          Swap
        </button>
      </form>
    </div>
  );
}

export default App;
