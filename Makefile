circom_installed := $(shell command -v circom 2> /dev/null)

init:
ifndef circom
	git clone https://github.com/iden3/circom.git
	(cd circom && cargo build --release && cargo install --path circom)
	sudo rm -rd circom/
endif	

