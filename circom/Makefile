clean:
	rm -dr out/*_cpp
	rm -dr out/*_js
	rm out/*.r1cs
	rm out/*.sym

build:
	circom *.circom --r1cs --wasm --sym --c -o out/

compute_witness:
	node out/spawn_js/generate_witness.js out/spawn_js/spawn.wasm example_inputs/valid_input.json out/spawn_js/witness.wtns
