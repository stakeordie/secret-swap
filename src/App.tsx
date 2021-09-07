import { getChainId, getKeplr, viewingKeyManager } from '@stakeordie/griptape.js';
import React, { useEffect } from 'react';
import './App.css';
import { setEstimatingFromA, setEstimatingFromB, setFormValues, setSelectedPair, updateContract, useSwap } from './context';

function App() {
  const { swapDispatch,swapState } = useSwap();
  const { contracts,pairs, formValues,estimatingFromA,estimatingFromB } = swapState;

  function onSelectChange (e:any,type: 'From' | 'To'): void{
    const contract = contracts.find(({ contract })=> contract.at === e.target.value);
    if(!contract) return;
    if(formValues.selectedFrom.token && formValues.selectedTo.token){
      const selectedPair = pairs[`${formValues.selectedFrom.token.address}-${formValues.selectedTo.token.address}`] || pairs[`${formValues.selectedTo.token.address}-${formValues.selectedFrom.token.address}`];
      setSelectedPair(swapDispatch,selectedPair)
    }
    setFormValues(swapDispatch,{ ...formValues, [`selected${type}`]: contract })
  }

  async function onSubmit (e:any) {
    e.preventDefault();
    if(!formValues.from || !formValues.to || !formValues.selectedFrom.contract || !formValues.selectedTo.contract) {
      alert('Missing fields');
      return;
    };
    // const balance_from = await formValues.selectedFrom.contract.getBalance();
    // const balance_to = await formValues.selectedTo.contract.getBalance();
  }
  
  useEffect(()=>{
    if(!formValues.selectedFrom.contract || !formValues.selectedTo.contract) return;
    if(estimatingFromA){
      console.log('Calculating from A')
    }else if(estimatingFromB){
      console.log('Calculating from B')
    }

  },[estimatingFromA,estimatingFromB,formValues])


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

  return (
    <div className="App">
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
