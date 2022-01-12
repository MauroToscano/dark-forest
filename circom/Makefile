clean:
	rm -dr out/*_cpp
	rm -dr out/*_js
	rm out/*

build:
	circom spawn.circom --r1cs --wasm --sym --c -o out/
	circom move.circom --r1cs --wasm --sym --c -o out/

start_initial_ceremony:
	snarkjs powersoftau new bn128 12 out/pot12_0000.ptau -v
	snarkjs powersoftau contribute out/pot12_0000.ptau out/pot12_0001.ptau --name="First contribution" -v
	snarkjs powersoftau prepare phase2 out/pot12_0001.ptau out/pot12_final.ptau -v

start_spawn_ceremony:
	snarkjs groth16 setup out/spawn.r1cs out/pot12_final.ptau out/spawn_0000.zkey
	snarkjs zkey contribute out/spawn_0000.zkey out/spawn_0001.zkey --name="1st Contributor Name" -v
	snarkjs zkey export verificationkey out/spawn_0001.zkey out/spawn_verification_key.json
	snarkjs zkey export solidityverifier out/spawn_0001.zkey out/spawn_verifier.sol

start_move_ceremony:
	snarkjs groth16 setup out/move.r1cs out/pot12_final.ptau out/move_0000.zkey
	snarkjs zkey contribute out/move_0000.zkey out/move_0001.zkey --name="1st Contributor Name" -v
	snarkjs zkey export verificationkey out/move_0001.zkey out/move_verification_key.json
	snarkjs zkey export solidityverifier out/move_0001.zkey out/MoveVerifier.sol

#Requires
#generate_witness.js, spawn.wasm, input.json
#spawn_0001.zkey
generate_spawn_proof:
	node out/spawn_js/generate_witness.js out/spawn_js/spawn.wasm example_inputs/valid_input.json out/spawn_js/witness.wtns
	snarkjs groth16 prove out/spawn_0001.zkey out/spawn_js/witness.wtns out/proof.json out/public.json

generate_move_proof:
	node out/move_js/generate_witness.js out/move_js/move.wasm example_inputs/valid_move_input.json out/move_js/witness.wtns
	snarkjs groth16 prove out/move_0001.zkey out/move_js/witness.wtns out/move_proof.json out/move_public.json

solidity_call:
	 snarkjs generatecall out/public.json out/proof.json
	
verify:
	snarkjs groth16 verify out/verification_key.json out/public.json out/proof.json

verify_move:
	snarkjs groth16 verify out/move_verification_key.json out/move_public.json out/move_proof.json
