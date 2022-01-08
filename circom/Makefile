clean:
	rm -dr out/*_cpp
	rm -dr out/*_js
	rm out/*

build:
	circom *.circom --r1cs --wasm --sym --c -o out/

compute_witness:
	node out/spawn_js/generate_witness.js out/spawn_js/spawn.wasm example_inputs/valid_input.json out/spawn_js/witness.wtns
	
start_ceremony:
	snarkjs powersoftau new bn128 12 out/pot12_0000.ptau -v
	snarkjs powersoftau contribute out/pot12_0000.ptau out/pot12_0001.ptau --name="First contribution" -v
	snarkjs powersoftau prepare phase2 out/pot12_0001.ptau out/pot12_final.ptau -v
	snarkjs groth16 setup out/spawn.r1cs out/pot12_final.ptau out/spawn_0000.zkey

	snarkjs zkey contribute out/spawn_0000.zkey out/spawn_0001.zkey --name="1st Contributor Name" -v
	snarkjs zkey export verificationkey out/spawn_0001.zkey out/verification_key.json
	snarkjs zkey export solidityverifier out/spawn_0001.zkey out/verifier.sol

proove:
	snarkjs groth16 prove out/spawn_0001.zkey out/spawn_js/witness.wtns out/proof.json out/public.json

verify:
	snarkjs groth16 verify out/verification_key.json out/public.json out/proof.json

solidity_call:
	 snarkjs generatecall out/public.json out/proof.json
	