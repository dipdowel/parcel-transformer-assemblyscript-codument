(async () => {
	const {
		instance: {
			exports: { add },
		},
	} = await WebAssembly.instantiateStreaming(
		fetch(new URL("./test.wat", import.meta.url))
	);

	console.log(add(1, 2));
})();
