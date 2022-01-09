circom := $(shell command -v circom 2> /dev/null)

init:
ifndef circom
	git clone https://github.com/iden3/circom.git circom_repo
	(cd circom_repo && cargo build --release && cargo install --path circom)
	sudo rm -rd circom_repo/
endif	

