# `parcel-transformer-assemblyscript-codument`

## Preface
The idea behind this transformer is to integrate development of WASM-modules in AssemblyScript
into the convenient web development process provided by Parcel.


## NPM scripts
As a developer you'd be mostly interested in the following two scripts:
### `"build"` 
Drops directory `dist` and rebuilds the project  
### `"go"`
Does the same as `"build"` + copies the entire package together with the compiled code to `/example/node_modules/` for convenience (faster debugging, etc.)

## TODO: Cover the following:
1. Installation
2. Write about the directory structure of the project preferred by AssemblyScript compiler
3. Explain the purpose and location of `asconfig.json`
    * In the transformer
    * In the user's project
4. Explain `*.as.ts` naming convention (in the user's project)
5. Explain the naming and placement of the entry point (`index.as.ts`) in the user's project
6. Explain where to find the `.d.ts` file for accessing WASM modules in TypeScript
7. Explain the difference between a development build and a release/production build
8. Explain how to pass CLI options to AssemblyScript Compiler
9. Explain `as-codument-config.json`

## Contributors
- Idea and the AssemblyScript part of the deal: [@dipdopwel](https://github.com/dipdowel)
- Guidance, support and contribution via PRs: [@mischnic](https://github.com/mischnic)