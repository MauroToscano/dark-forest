# dark-forest
A Dark Forest implementation for the ZKU Course

## To run with nix (Truffle not included)

nix-shell

## To install dependencies if needed

make init

## To install truffle (Outside nix)

npm install -g truffle

## To run a test network and deploy

truffle develop
migrate

Then in another shell

make start_app

Also, remember to add truffle local network to metamask and reset the account after restarting the network, else you will see an invalid nonce error (Advanced options in metamask)

Usually:

http://127.0.0.1:9545/

Chain ID: 1337

And import a test account with a test private key, for example:

6c2db00191d7dc4fc3a2c32de362aebcb9f79bede3818524115d1fc4f875769c

(If deploying with remix or other tool, Truffle can be skipped, ganache cli is included in the nix-shell)

To interact with the contract directly, use:

let specificInstance = await Positions.at("0x3b58A6bFD71e19F6b23978145048962C51a3E3FB");
