import React from 'react';
import './App.css';
import { setFormValues, useSwap } from './context';

function App() {
  const { swapDispatch,swapState } = useSwap();
  const { tokens, contracts, formValues} = swapState;

  function onSelectChange (e:any,type: 'From' | 'To'): void{
    const contract = contracts.find((contract)=> contract.at === e.target.value);
    if(!contract) return;
    
    setFormValues(swapDispatch,{ ...formValues, [`select${type}`]: contract })
    
  }
  function onSubmit (e:any) {
    e.preventDefault();
    console.log(`Creating transaction`)
  }

  return (
    <div className="App">
      <h1>Swap</h1>
      <form onSubmit={onSubmit} className='form'> 

          <h3> From </h3>
          <label htmlFor="">Balance: 0</label>
          <select name="select-from" onChange={(e)=>onSelectChange(e,'From')}> 
            <option value=''/>
            {tokens.map((token,i)=> <option key={`From-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input type="number" placeholder="0"/>

          <h3 > To </h3>
          <label htmlFor="">Balance: 0</label>
          <select name="select-to" onChange={(e)=>onSelectChange(e,'To')}> 
            <option value=''/>
            {tokens.map((token,i)=> <option key={`To-${i}`} value={token.address}>{token.name}</option>)} 
          </select>
          <input type="number" placeholder="0"/>

          <button type="submit">Swap</button>

      </form>
    </div>
  );
}

export default App;
