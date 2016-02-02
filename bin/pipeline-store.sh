#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"

key="$2"
value="$3"
keyname="$4"

echo "Arg 0 is $0"
echo "Arg 1 is $1"
echo "Arg 2 is $2"
echo "Arg 3 is $3"
echo "Arg 4 is $4"

bootstrap() {
	echo "In pipeline-store.sh boostrap function"
	KVBASH_FILE="$script_dir/../kv-bash/kv-bash"
	if [ ! -f "$KVBASH_FILE" ]; then
	    rm -rf kv-bash
		#Fork This to Stelligent after testing
		git clone https://github.com/PaulDuvall/kv-bash
		cd kv-bash
		source ./kv-bash 
	fi
	
	# kvset user mr.bob
	# kvset pass abc@123
	# kvlist
	# kvget user
	# kvget pass
	# kvdel pass
	# kvget pass
}


setValue() {
	echo "In pipeline-store.sh setValue function"
	if [ -z "$key" ]; then
    	echo "Fatal: The key arg cannot be empty when calling setValue " 2>&1
    	exit 1
	fi
		if [ -z "$value" ]; then
    	echo "Fatal: The value arg cannot be empty when calling setValue " 2>&1
    	exit 1
	fi
	cd kv-bash
	source ./kv-bash
	kvset $key $value
}

getValue() {
	echo "In pipeline-store.sh getValue function"
	if [ -z "$key" ]; then
    	echo "Fatal: The key arg cannot be empty when calling getValue " 2>&1
    	exit 1
	fi
	cd kv-bash
	source ./kv-bash
	kvget $key
}

list() {
	cd kv-bash
	source ./kv-bash
	echo "In list function..."
	kvlist
}

# Always call bootstrap
bootstrap

# call arguments verbatim:
$@
