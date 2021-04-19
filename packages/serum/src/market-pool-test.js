import { PublicKey } from "@solana/web3.js";
import { PoolMarket } from "./pool-market";

const p = new PoolMarket(null,1, 1,undefined, 
    new PublicKey("11111111111111111111111111111111"), 
    new PublicKey("11111111111111111111111111111111"), {address: new PublicKey("11111111111111111111111111111111"), 
//@ts-ignore
state:{
}, 
program: new PublicKey("11111111111111111111111111111111") });
