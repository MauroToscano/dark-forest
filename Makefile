circom := $(shell command -v circom 2> /dev/null)

init:
ifndef circom
	git clone https://github.com/iden3/circom.git
	(cd circom && cargo build --release && cargo install --path circom)
	sudo rm -rd circom/
endif	

node spawn_js/generate_witness.js spawn.wasm example_inputs/*.json spawn_js/witness.wtns
