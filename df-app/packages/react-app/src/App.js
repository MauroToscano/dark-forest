import { useQuery } from "@apollo/react-hooks";
import React, { useEffect, useState } from "react";

import { Body, Button, Header } from "./components";
import useWeb3Modal from "./hooks/useWeb3Modal";

import GET_TRANSFERS from "./graphql/subgraph";

import positionsAbi from "./abis/Positions.json"

import { ethers } from "ethers";

const snarkjs = require("snarkjs");

const spawn_wasm = 'spawn.wasm'
const spawn_zkey = 'spawn_0001.zkey'
const move_wasm = 'move.wasm'
const move_zkey = 'move_0001.zkey'
const witness_calculator_spawn = require('./witness_calculator_spawn.js')
const witness_calculator_move = require('./witness_calculator_move.js')

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

  const [xInput, setXInput] = useState();
  const [yInput, setYInput] = useState();
  const [currentX, setCurrentX] = useState();
  const [currentY, setCurrentY] = useState();

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


  const getBinaryPromiseSpawn = () => new Promise((resolve, reject) => {
    fetch(spawn_wasm, { credentials: 'same-origin' })
      .then(
        response => {
         if (!response['ok']) {
          throw "failed to load wasm binary file at '" + spawn_wasm + "'";
         }
         return response['arrayBuffer']();
        }
      )
      .then(resolve)
      .catch(reject);
   });
  
   const getBinaryPromiseMove = () => new Promise((resolve, reject) => {
    fetch(move_wasm, { credentials: 'same-origin' })
      .then(
        response => {
         if (!response['ok']) {
          throw "failed to load wasm binary file at '" + move_wasm + "'";
         }
         return response['arrayBuffer']();
        }
      )
      .then(resolve)
      .catch(reject);
   });


  async function initializePosition() {
    if(provider){
      const inputs = {x: xInput,y: yInput} // replace with your signals
      const buffer = await getBinaryPromiseSpawn()
      const witnessCalculator = await witness_calculator_spawn(buffer)
      let buff;

      try{
        buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
        setErrorMessage("")

      }catch(err){
        console.log("Error: ", err)
        setErrorMessage("Position not validid \n 32 < d({x,y},{0,0}) < 64")
        return
      }
      const { proof, publicSignals } = await snarkjs.groth16.prove(spawn_zkey,buff)
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
              await position_contract.insert_initial_position(
                ...callData
              ,
              { gasLimit: 400000 })
          await transaction.wait()
          setCurrentX(xInput)
          setCurrentY(yInput)
          console.log("Initialized position")
      } catch(err) {
          console.log("Error")
          console.log(err)
          setErrorMessage("Position already taken")
      }
    }
  }
  
  async function moveToPosition() {
    if(provider){
      const inputs = {x1: currentX, y1: currentY, x2: xInput, y2: yInput} // replace with your signals
      console.log("Inputs: ", inputs)
      const buffer = await getBinaryPromiseMove()
      const witnessCalculator = await witness_calculator_move(buffer)
      let buff;

      try{
        buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
        setErrorMessage("")
      }catch(err){
        console.log("Error: ", err)
        setErrorMessage("You can not move to a distance superior than 16")
        return
      }

      const { proof, publicSignals } = await snarkjs.groth16.prove(move_zkey,buff)
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
              await position_contract.move_to_new_position(
                ...callData
              ,
              { gasLimit: 400000 })
          await transaction.wait()
          setCurrentX(xInput)
          setCurrentY(yInput)
          console.log("Moved to new position")
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
      {currentY ?  
          <React.Fragment>
          <label>
            You are at: {currentX}, {currentY}
          </label>
            <Button style={{ margin: '2%' }} onClick={() => moveToPosition()}>
              Move to next position
            </Button> 

          </React.Fragment>  
          :
          <Button onClick={() => initializePosition()}>
            Initialize Position
          </Button>
        }   
        <div style={{ margin: '2%' }} >
          <label>
            x:
            <input type="number" onChange={e => setXInput(e.target.value)} />        
          </label>
          <label>
            y:
            <input type="number" onChange={e => setYInput(e.target.value)} />        
          </label>
        </div>
       
        {errorMessage && (
            <p className="error"> { errorMessage } </p>
          )
        }
      </Body>
    </div>
  );
}

export default App;
