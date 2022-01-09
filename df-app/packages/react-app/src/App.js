import { useQuery } from "@apollo/react-hooks";
import React, { useEffect, useState } from "react";

import { Body, Button, Header } from "./components";
import useWeb3Modal from "./hooks/useWeb3Modal";

import GET_TRANSFERS from "./graphql/subgraph";

import positionsAbi from "./abis/Positions.json"

import { ethers } from "ethers";

const snarkjs = require("snarkjs");

const wasm = 'spawn.wasm'
const zkey = 'spawn_0001.zkey'
const wc = require('./witness_calculator.js')

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }

        // Load the user's accounts.
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);

        let name;

        try{
          // This operation can fail if ENS is not setup properly
          // Local test network may not have ENS setup properly
          name = await provider.lookupAddress(accounts[0]);
        } catch(e) { 
          name = null
        }

        // Render either the ENS name or the shortened account address.
        if (name) {
          setRendered(name);
        } else {
          setRendered(account.substring(0, 6) + "..." + account.substring(36));
        }
      } catch (err) {
        setAccount("");
        setRendered("");
        console.error(err);
      }
    }
    fetchAccount();
  }, [account, provider, setAccount, setRendered]);

  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}



function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  //Code from ETH scaffold with circuits
  function parseSolidityCalldata(prf, sgn) {
    // let i = [];
    // while (i[i.length-1] != -1) {
    //    i.push(str.indexOf('"', i[i.length-1]+1));
    // }
    // i.pop();
    // let data = [];
    // for (let j = 0; j<i.length-1; j+=2) {
    //   data.push(str.slice(i[j]+1, i[j+1]));
    // }
    // let calldata = [
    //   [data[0].slice(2), data[1].slice(2)],
    //   [
    //     [data[2].slice(2), data[3].slice(2)],
    //     [data[4].slice(2), data[5].slice(2)]
    //   ],
    //   [data[6].slice(2), data[7].slice(2)],
    //   [data[8].slice(2), data[9].slice(2)]
    // ];

    let calldata = [
      [prf.pi_a[0], prf.pi_a[1]],
      [
        [prf.pi_b[0][1], prf.pi_b[0][0]],
        [prf.pi_b[1][1], prf.pi_b[1][0]]
      ],
      [prf.pi_c[0], prf.pi_c[1]],
      [...sgn]
    ];

    return calldata;
  }

  /*
  Full proove isn't working, a workaround posted in:
  https://github.com/iden3/snarkjs/issues/107

  Adapted it to work in the frontend
  */


  const getBinaryPromise = () => new Promise((resolve, reject) => {
    fetch(wasm, { credentials: 'same-origin' })
      .then(
        response => {
         if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasm + "'";
         }
         return response['arrayBuffer']();
        }
      )
      .then(resolve)
      .catch(reject);
   });

  async function initializePosition() {
    if(provider){
      const inputs = {x,y} // replace with your signals
      const buffer = await getBinaryPromise()
      const witnessCalculator = await wc(buffer)
      let buff;

      try{
        buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
        setErrorMessage("")

      }catch(err){
        console.log("Error: ", err)
        setErrorMessage("Position not validid \n 32 < d({x,y},{0,0}) < 64")
        return
      }
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkey,buff)
      console.log("Pub: ", publicSignals)
      console.log("Proof: ", proof)

      let signer = await provider.getSigner();

      //Curently using truffle default contract address
      const contractAddress = "0x3b58A6bFD71e19F6b23978145048962C51a3E3FB"

      const position_contract 
      = new ethers.Contract(
        contractAddress, 
        positionsAbi.abi, 
        signer)

      const callData =  parseSolidityCalldata(proof, publicSignals)

      console.log("Calldata: ", ...callData)
      let transaction;
      try {
          transaction = 
              await position_contract.insert_position(
                ...callData
              ,
              { gasLimit: 400000 })
          await transaction.wait()
          console.log("Inserted data")
      } catch(err) {
          console.log("Error")
          console.log(err)
          setErrorMessage("Position already taken")
      }
    }
  }
  
  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <div/>
      <Header style={{display: 'flex',  justifyContent:'center', fontSize: '15vh'}}>
        Dark Forest
      </Header>
      <Body>
        <div style={{ margin: '2%' }} >
          <label>
            x:
            <input type="number" onChange={e => setX(e.target.value)} />        
          </label>
          <label>
            y:
            <input type="number" onChange={e => setY(e.target.value)} />        
          </label>
        </div>
        <Button onClick={() => initializePosition()}>
          Initialize Position
        </Button>   
        {errorMessage && (
          <p className="error"> { errorMessage } </p>
        )}

      </Body>
    </div>
  );
}

export default App;
