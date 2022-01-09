// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

//It requires the verifier .sol generated
//using circom
import './Verifier.sol';

contract Positions is Verifier {

    mapping (uint256 => bool) public positions_used;

    function insert_position(            
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input) 
    public{
        require(
            verifyProof(a,b,c,input),
            "Failed proof check"
        );

        /*
            There should be another require in the future, 
            as to take in account the 5 mins windows.

            It may be needed to store a timestamp along with the position
        */
        require(!positions_used[input[0]], "Position is already occupied");

        positions_used[input[0]] = true;
    }
}