import React from 'react';
import './App.css';
import { setFormValues, useSwap } from './context';

function App() {
  const { swapDispatch,swapState } = useSwap();
  const { contracts, formValues} = swapState;

  function onSelectChange (e:any,type: 'From' | 'To'): void{
    const contract = contracts.find(({ contract })=> contract.at === e.target.value);
    if(!contract) return;
    
    setFormValues(swapDispatch,{ ...formValues, [`selected${type}`]: contract })
    
  }
  function onSubmit (e:any) {
    e.preventDefault();
    if(!formValues.from || !formValues.to || !formValues.selectedFrom.contract || !formValues.selectedTo.contract) {
      alert('Missing fields');
      return;
    };
    console.log(`Creating transaction`)
  }

  return (
    <div className="App">
      <h1>Swap</h1>
      <form onSubmit={onSubmit} className='form'> 

          <h3> From </h3>
          <label htmlFor="">
            {
              (formValues?.selectedFrom.contract) 
                ? (formValues.selectedFrom?.token?.balance) ? `Balance: ${formValues?.selectedFrom?.token?.balance }`:  <button type='button' onClick={()=> formValues?.selectedFrom?.contract?.createViewingKey()}>Create Viewing Key</button> 
                : 'Balance: 0'
            }     
          </label>
          <select name="select-from" onChange={(e)=>onSelectChange(e,'From')}> 
            <option value=''/>
            {contracts.map(({ token },i)=> <option key={`From-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input value={formValues.from} type="number" placeholder="0"/>

          <h3 > To </h3>
          <label htmlFor="">
            {
              (formValues?.selectedTo.contract) 
                ? (formValues.selectedTo?.token?.balance) ? `Balance: ${formValues?.selectedTo?.token?.balance }`:  <button type='button' onClick={()=> formValues?.selectedTo?.contract?.createViewingKey()}>Create Viewing Key</button> 
                : 'Balance: 0'
            }  
          </label>
          <select name="select-to" onChange={(e)=>onSelectChange(e,'To')}> 
            <option value=''/>
            {contracts.map(({ token },i)=> <option key={`To-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input value={formValues.to} type="number" placeholder="0"/>

          <button type="submit">Swap</button>

      </form>
    </div>
  );
}

export default App;
