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

  function onSelectChange(e: any, type: "From" | "To"): void {
    const contract = contracts.find(
      ({ contract }) => contract.at === e.target.value
    );
    if (!contract) return;
    if (selectedFrom.token && selectedTo.token) {
      const selectedPair =
        pairs[`${selectedFrom.token.address}-${selectedTo.token.address}`] ||
        pairs[`${selectedTo.token.address}-${selectedFrom.token.address}`];
      if (selectedPair) {
        setSelectedPair(swapDispatch, selectedPair);
      }
    }
    type === "From"
      ? setSelectedFrom(swapDispatch, contract)
      : setSelectedTo(swapDispatch, contract);
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
          const { address, token_code_hash } = selectedFrom.token;
          const amount = coinConvert(
            from,
            selectedFrom.token.decimals,
            "machine"
          );
          const res = await selectedPair.contract.simulate(
            address,
            token_code_hash,
            amount
          );
          if (res) {
            const expected_return = coinConvert(
              res.commission_amount,
              selectedFrom.token.decimals,
              "human"
            );
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
    selectedPair.contract,
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
