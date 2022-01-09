import { useQuery } from "@apollo/react-hooks";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import React, { useEffect, useState } from "react";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

const snarkjs = require("snarkjs");

const wasm = 'spawn.wasm'
const zkey = 'spawn_0001.zkey'
const INPUTS_FILE = '/tmp/inputs'
const WITNESS_FILE = '/tmp/witness'
const wc = require('./witness_calculator.js')

const fs = require('fs')

async function readOnChainData() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
  const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
  // A pre-defined address that owns some CEAERC20 tokens
  const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
  console.log({ tokenBalance  : tokenBalance.toString() });
}


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


  /*
  Full proove isn't working, a workaround posted in:
  https://github.com/iden3/snarkjs/issues/107
  TO DO: Update when the issue is fixed, else For a release version, 
  change how it's done as to not use a fetch
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
    console.log(process.version);

    if(provider){
      const inputs = { x: 25, y: 25 } // replace with your signals
      const buffer = await getBinaryPromise()
      const witnessCalculator = await wc(buffer)
      const buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkey,buff)
      console.log("Pub: ", publicSignals)
      console.log("Proof: ",  proof)
    }
  }
  
  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  console.log("Version")
  console.log(process.version)

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
        <Button onClick={() => initializePosition()}>
          Initialize Position
        </Button>
      </Body>
    </div>
  );
}

export default App;
