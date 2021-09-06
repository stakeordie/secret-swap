import  { createContract }  from "../utils";
import * as React from "react";
import { createContext, HTMLAttributes, useContext, useReducer } from "react";

type SwapAction =
  | {
      readonly type: "setLoading";
      readonly payload: boolean;
    }
  | {
      readonly type: "setAddresses";
      readonly payload: string[];
    }
  |
    {
      readonly type: "setContracts";
      readonly payload: Array<Contract>;
    }
  |
    {
      readonly type: "setFormValues";
      readonly payload: FormValues;
    }
  ;
  export type FormValues =  {
  selectedFrom: Record<string,any>
  selectedTo: Record<string,any>
  from:string,
  to:string,
}

export type TokenInfo = {
  address:string,
  balance:string,
  decimals:number,
  symbol:string,
  name:string,
  total_supply:string,
 }

type SwapDispatch = (action: SwapAction) => void;

type SwapState = {
  readonly addresses: string[];
  readonly loading: boolean;
  readonly contracts: Array<Contract>;
  readonly formValues: FormValues;
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
    case "setAddresses": {
      return { ...SwapState, addresses: action.payload };
    }
    case "setContracts": {
      return { ...SwapState, contracts: action.payload };
    }
    case "setFormValues": {
      return { ...SwapState, formValues: action.payload };
    }
    default: {
      throw new Error("Unhandled action type");
    }
  }
}

export function setLoading(dispatch: SwapDispatch, loading: boolean): void {
  dispatch({ type: "setLoading", payload: loading });
}
export function setContracts(dispatch: SwapDispatch, contracts: Array<Contract>): void {
  dispatch({ type: "setContracts", payload: contracts });
}
export function setFormValues(dispatch: SwapDispatch, formValues:FormValues): void {
  dispatch({ type: "setFormValues", payload: formValues });
}

export const useSwap = (): NonNullable<SwapContextType> => {
  const context = useContext(SwapContext);

  if (context === undefined) {
    throw new Error("useSwap must be used within a swapProvider");
  }

  return context;
};
interface Contract {
  token: TokenInfo,
  contract: Record<string, any>
}

export default function SwapProvider({ children }: HTMLAttributes<HTMLOrSVGElement>): JSX.Element {
  const [swapState, swapDispatch] = useReducer(SwapReducer, {
    loading: false,
    addresses:
    //SCRT
    ['secret1s7c6xp9wltthk5r6mmavql4xld5me3g37guhsx',
    //SEFI
    'secret12q2c5s5we5zn9pq43l0rlsygtql6646my0sqfm',
    //sETH
    'secret1ttg5cn3mv5n9qv8r53stt6cjx8qft8ut9d66ed'],
    contracts: [],
    formValues: {
        selectedFrom:{ },
        selectedTo:{ },
        from:'',
        to:''
      },
    },
  );
  React.useEffect(()=>{
      (async()=>{
          //Get contract instances
        console.log('Creating contracts base on address')
        const unsolvedContracts = swapState.addresses.map(async (addr) => {
          const contract = await createContract('addr',addr);
          const { token_info } = await contract?.getTokenInfo()
          const  balance  = await contract?.getBalance()
          return { token: { ...token_info,address:contract.at, balance, }, contract };
        })
        const contracts:Array<Contract> = await Promise.all(unsolvedContracts);
        setContracts(swapDispatch,contracts)        
      })()
  },[swapState.addresses])



  return (
    <SwapContext.Provider value={{ swapState, swapDispatch }}>
      {children}
    </SwapContext.Provider>
  );
}
