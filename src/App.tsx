import { coinConvert, getChainId, getKeplr, viewingKeyManager } from '@stakeordie/griptape.js';
import 'semantic-ui-css/semantic.min.css'
import React, { useEffect } from 'react';
import { Loader } from 'semantic-ui-react';
import './App.css';
import { setEstimatingFromA, setEstimatingFromB, setFormValues, setSelectedPair, updateContract, useSwap ,setLoading} from './context';

function App() {
  const { swapDispatch,swapState } = useSwap();
  const { contracts,pairs, formValues,estimatingFromA,estimatingFromB ,selectedPair,loading} = swapState;

  function onSelectChange (e:any,type: 'From' | 'To'): void{
    const contract = contracts.find(({ contract })=> contract.at === e.target.value);
    if(!contract) return;
    if(formValues.selectedFrom.token && formValues.selectedTo.token){
      const selectedPair = pairs[`${formValues.selectedFrom.token.address}-${formValues.selectedTo.token.address}`] 
                        || pairs[`${formValues.selectedTo.token.address}-${formValues.selectedFrom.token.address}`];
      if(selectedPair){

        setSelectedPair(swapDispatch,selectedPair)
      }
    }
    setFormValues(swapDispatch,{ ...formValues, [`selected${type}`]: contract })
  }

  async function onSubmit (e:any) {
    setLoading(swapDispatch,true)
    e.preventDefault();
    if(!formValues.from || !formValues.to || !formValues.selectedFrom.contract || !formValues.selectedTo.contract || !selectedPair) {
      alert('Missing fields');
      return;
    };
    const amount = coinConvert(formValues.from,formValues.selectedFrom.token.decimals,'machine');
    const expected_return = coinConvert(formValues.to,formValues.selectedFrom.token.decimals,'machine');
    const msg = btoa(JSON.stringify({
      swap:{
        expected_return
      }
    }))
    try {
      const res = await formValues.selectedFrom.contract.send(selectedPair.contract.at,amount,msg)
      if(res){
        const tokenA = await updateContract(swapDispatch,swapState,formValues.selectedFrom.token.address)
        const tokenB = await updateContract(swapDispatch,swapState,formValues.selectedTo.token.address)
        setFormValues(swapDispatch,{...formValues,selectedFrom:tokenA,selectedTo:tokenB})
      }
    } catch (error) {
      console.error(error)
    }
    finally{
      setLoading(swapDispatch,false)
    }
  }

  async function createViewingKey(address:string,contract: Record<string,any>,type:'From' | 'To') {
    try {
      const keplr = await getKeplr();
      const chain = await getChainId();
      await keplr.suggestToken(chain,address);
      const vk = await keplr.getSecret20ViewingKey(chain,address);
      viewingKeyManager.add(contract,vk);
      await updateContractStore(type,address);
      
    } catch (error) {
      console.error(error)
    }
  }

  async function updateContractStore (type:'From' | 'To',address:string){
    try {
      const res = await updateContract(swapDispatch,swapState,address)
      setFormValues(swapDispatch,{...formValues, [`selected${type}`]:res })
    } catch (error) {
      return;
    }
  }

  useEffect(()=>{
    (async()=>{
      if(!formValues.selectedFrom.contract || !formValues.selectedTo.contract || !selectedPair.contract) return;
      try {
        if(estimatingFromA && formValues.from) {
          const { address, token_code_hash } = formValues.selectedFrom.token;
          const amount = coinConvert(formValues.from,formValues.selectedFrom.token.decimals,'machine');
          const res = await selectedPair.contract.simulate(address,token_code_hash,amount);
          if(res){
            const expected_return = coinConvert(res.commission_amount,formValues.selectedFrom.token.decimals,'human');
            setFormValues(swapDispatch,{...formValues,to:expected_return})
          }
          
        }else if(estimatingFromB && formValues.to){
          //Query reverse
        }      
      } catch (error) {
        
      }
    })()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formValues.from,formValues.selectedFrom,formValues.selectedTo])

  return (
    <div className="App">
      {
        (loading) && 
            <Loader className='center' active size='massive'>Loading</Loader>
        
      }
      <h1>Swap</h1>
      <form onSubmit={onSubmit} className='form'> 

          <h3> From </h3>
          <label htmlFor="">
            {
              (formValues?.selectedFrom.contract) 
                ? (formValues.selectedFrom?.token?.balance) ? `Balance: ${formValues?.selectedFrom?.token?.balance }`:  <button type='button' onClick={()=>createViewingKey(formValues.selectedFrom.token.address,formValues.selectedFrom.contract,'From')}>Create Viewing Key</button> 
                : 'Balance: 0'
            }     
          </label>
          <select name="select-from" onChange={(e) => onSelectChange(e,'From')}> 
            <option value=''/>
            {contracts.map(({ token },i)=> <option key={`From-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input value={formValues.from} type="number" placeholder="0" onChange={(e) => {
            setEstimatingFromA(swapDispatch);
            setFormValues(swapDispatch,{...formValues, from: e.target.value})
          }}/>

          <h3 > To </h3>
          <label htmlFor="">
            {
              (formValues?.selectedTo.contract) 
                ? (formValues.selectedTo?.token?.balance) ? `Balance: ${formValues?.selectedTo?.token?.balance }`:  <button type='button' onClick={()=>createViewingKey(formValues.selectedTo.token.address,formValues.selectedTo.contract,'To')}>Create Viewing Key</button> 
                : 'Balance: 0'
            }  
          </label>
          <select name="select-to" onChange={(e)=>onSelectChange(e,'To')}> 
            <option value=''/>
            {contracts.map(({ token },i)=> <option key={`To-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input value={formValues.to} type="number" placeholder="0"  onChange={(e) => {
            setEstimatingFromB(swapDispatch)
            setFormValues(swapDispatch,{...formValues, to: e.target.value});
          }}/>

          <button type="submit" disabled={!formValues.from || !formValues.to || !formValues.selectedFrom.contract || !formValues.selectedTo.contract}>Swap</button>

      </form>
    </div>
  );
}

export default App;
