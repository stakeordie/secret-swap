import { createContract,snip20Def,extendContract } from "@stakeordie/griptape.js"
const def = {
    queries:{
        simulate(){
            return { simulation: { } }
        }
    }
}
function createPairContract( id:string ,address:string ){
    return createContract({
        id:id,
        at:address,
        definition:extendContract(snip20Def,def),
    })
}

export default createPairContract;