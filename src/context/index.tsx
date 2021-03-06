import {
  createContract,
  createFactoryContract,
  createPairContract,
  getCodeHash,
} from "../utils";
import * as React from "react";
import { createContext, HTMLAttributes, useContext, useReducer } from "react";
import { coinConvert } from "@stakeordie/griptape.js";

type SwapAction =
  | {
      readonly type: "setLoading";
      readonly payload: boolean;
    }
  | {
      readonly type: "setEstimatingFromA";
      readonly payload: boolean;
    }
  | {
      readonly type: "setEstimatingFromB";
      readonly payload: boolean;
    }
  | {
      readonly type: "setAddresses";
      readonly payload: string[];
    }
  | {
      readonly type: "setContracts";
      readonly payload: Array<Contract>;
    }
  | {
      readonly type: "setPairs";
      readonly payload: { [k: string]: any };
    }
  | {
      readonly type: "setSelectedPair";
      readonly payload: any;
    }
  | {
      readonly type: "setSelectedFrom";
      readonly payload: Record<string, any>;
    }
  | {
      readonly type: "setSelectedTo";
      readonly payload: Record<string, any>;
    }
  | {
      readonly type: "setFrom";
      readonly payload: string;
    }
  | {
      readonly type: "setTo";
      readonly payload: string;
    };

export type TokenInfo = {
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
  name: string;
  total_supply: string;
};

type SwapDispatch = (action: SwapAction) => void;

type SwapState = {
  readonly addresses: string[];
  readonly loading: boolean;
  readonly contracts: Array<Contract>;
  readonly selectedFrom: Record<string, any>;
  readonly selectedTo: Record<string, any>;
  readonly from: string;
  readonly to: string;
  readonly estimatingFromA: boolean;
  readonly estimatingFromB: boolean;
  readonly pairs: { [k: string]: any };
  readonly selectedPair: any;
};

type SwapContextType =
  | {
      readonly swapDispatch: SwapDispatch;
      readonly swapState: SwapState;
    }
  | undefined;

const SwapContext = createContext<SwapContextType>(undefined);

function SwapReducer(SwapState: SwapState, action: SwapAction): SwapState {
  switch (action.type) {
    case "setLoading": {
      return { ...SwapState, loading: action.payload };
    }
    case "setEstimatingFromA": {
      return { ...SwapState, estimatingFromA: action.payload };
    }
    case "setEstimatingFromB": {
      return { ...SwapState, estimatingFromB: action.payload };
    }
    case "setAddresses": {
      return { ...SwapState, addresses: action.payload };
    }
    case "setContracts": {
      return { ...SwapState, contracts: action.payload };
    }
    case "setPairs": {
      return { ...SwapState, pairs: action.payload };
    }
    case "setSelectedPair": {
      return { ...SwapState, selectedPair: action.payload };
    }
    case "setSelectedFrom": {
      return { ...SwapState, selectedFrom: action.payload };
    }
    case "setSelectedTo": {
      return { ...SwapState, selectedTo: action.payload };
    }
    case "setFrom": {
      return { ...SwapState, from: action.payload };
    }
    case "setTo": {
      return { ...SwapState, to: action.payload };
    }
    default: {
      throw new Error("Unhandled action type");
    }
  }
}

export function setLoading(dispatch: SwapDispatch, loading: boolean): void {
  dispatch({ type: "setLoading", payload: loading });
}
export function setContracts(
  dispatch: SwapDispatch,
  contracts: Array<Contract>
): void {
  dispatch({ type: "setContracts", payload: contracts });
}
export function setSelectedFrom(
  dispatch: SwapDispatch,
  selected: Record<string, any>
): void {
  dispatch({ type: "setSelectedFrom", payload: selected });
}
export function setSelectedTo(
  dispatch: SwapDispatch,
  selected: Record<string, any>
): void {
  dispatch({ type: "setSelectedTo", payload: selected });
}
export function setFrom(dispatch: SwapDispatch, val: string): void {
  dispatch({ type: "setFrom", payload: val });
}
export function setTo(dispatch: SwapDispatch, val: string): void {
  dispatch({ type: "setTo", payload: val });
}
export function setEstimatingFromA(dispatch: SwapDispatch): void {
  dispatch({ type: "setEstimatingFromB", payload: false });
  dispatch({ type: "setEstimatingFromA", payload: true });
}
export function setEstimatingFromB(dispatch: SwapDispatch): void {
  dispatch({ type: "setEstimatingFromA", payload: false });
  dispatch({ type: "setEstimatingFromB", payload: true });
}
export function setSelectedPair(dispatch: SwapDispatch, pair: any): void {
  dispatch({ type: "setSelectedPair", payload: pair });
}
export function setPairs(
  dispatch: SwapDispatch,
  pairs: { [k: string]: any }
): void {
  dispatch({ type: "setPairs", payload: pairs });
}
export async function updateContract(
  dispatch: SwapDispatch,
  state: SwapState,
  tokenAddr: string
): Promise<any> {
  let contractFinal;
  const unsolved_contracts: Promise<Contract>[] = state.contracts.map(
    async (c): Promise<Contract> => {
      if (c.token.address === tokenAddr) {
        const { contract } = c;
        const { token_info } = await contract?.getTokenInfo();
        const res = await contract?.getBalance();
        const balance = coinConvert(res?.balance?.amount, c.token.decimals);
        contractFinal = {
          token: { ...token_info, address: contract.at, balance },
          contract,
        };
        return contractFinal;
      } else {
        return new Promise((res) => {
          return res(c);
        });
      }
    }
  );
  const contracts = await Promise.all(unsolved_contracts);
  dispatch({ type: "setContracts", payload: contracts });
  return contractFinal;
}

export const useSwap = (): NonNullable<SwapContextType> => {
  const context = useContext(SwapContext);

  if (context === undefined) {
    throw new Error("useSwap must be used within a swapProvider");
  }

  return context;
};
interface Contract {
  token: TokenInfo;
  contract: Record<string, any>;
}

export default function SwapProvider({
  children,
}: HTMLAttributes<HTMLOrSVGElement>): JSX.Element {
  const [swapState, swapDispatch] = useReducer(SwapReducer, {
    loading: true,
    estimatingFromA: true,
    estimatingFromB: false,
    addresses:
      //SCRT
      [
        "secret1s7c6xp9wltthk5r6mmavql4xld5me3g37guhsx",
        //SEFI
        "secret12q2c5s5we5zn9pq43l0rlsygtql6646my0sqfm",
        //sETH
        "secret1ttg5cn3mv5n9qv8r53stt6cjx8qft8ut9d66ed",
      ],
    contracts: [],
    pairs: {},
    selectedPair: {},
    selectedFrom: {},
    selectedTo: {},
    from: "",
    to: "",
  });
  React.useEffect(() => {
    (async () => {
      //Get contract instances
      console.log("Creating contracts based on address");
      const unsolvedContracts = swapState.addresses.map(async (addr) => {
        const contract = await createContract(addr, addr);
        const { token_info } = await contract?.getTokenInfo();
        const res = await contract?.getBalance();
        const balance = coinConvert(res?.balance?.amount, token_info.decimals);
        const token_code_hash = await getCodeHash(contract.at);
        return {
          token: {
            ...token_info,
            address: contract.at,
            balance,
            token_code_hash,
          },
          contract,
        };
      });
      const contracts: Array<Contract> = await Promise.all(unsolvedContracts);
      setContracts(swapDispatch, contracts);
    })();
  }, [swapState.addresses]);

  React.useEffect(() => {
    (async () => {
      try {
        const factory = createFactoryContract(
          "factory",
          "secret1ypfxpp4ev2sd9vj9ygmsmfxul25xt9cfadrxxy"
        );
        const data = await factory.getPairs();
        const pairs: any = {};
        data.pairs.forEach(async (pair: any, i: number): Promise<void> => {
          const contractA =
            pair.asset_infos[0]?.token?.contract_addr ||
            pair.asset_infos[0]?.native_token?.denom;
          const contractB =
            pair.asset_infos[1]?.token?.contract_addr ||
            pair.asset_infos[1]?.native_token?.denom;

          const contract = await createPairContract(
            pair.contract_addr,
            pair.contract_addr
          );

          pairs[`${contractA}-${contractB}`] = { ...pair, contract };
        });
        setPairs(swapDispatch, pairs);
        setLoading(swapDispatch, false);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <SwapContext.Provider value={{ swapState, swapDispatch }}>
      {children}
    </SwapContext.Provider>
  );
}
