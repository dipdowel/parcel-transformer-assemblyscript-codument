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

6. Explain where to find the `.d.ts` file for accessing WASM modules in TypeScript
   - Implement a configuration for the destination of the `.d.ts` file
8. Explain the difference between a development build and a release/production build
8. Explain how to pass CLI options to AssemblyScript Compiler
9. Explain `as-codument-config.json`
- - - - - - - - - - - - - - -
## Done: the following was covered:
4. Explain `*.as.ts` naming convention (in the user's project)
5. Explain the naming and placement of the entry point (`index.as.ts`) in the user's project

## Contributors
- Idea and the AssemblyScript part of the deal: [@dipdopwel](https://github.com/dipdowel)
- Guidance, support and contribution via PRs: [@mischnic](https://github.com/mischnic)


- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# DRAFT
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

## Introduction

### Files and directories, naming and location conventions.
- The entry point to the WASM module must be in file `/assembly/index.as.ts`.
- All the AssemblyScript files must be located under `/assembly`.
- There can be subdirectories in `/assembly`.
- The only files that needs to have `as.ts` extension is `index.as.ts` all the other.
Files with source code written in AssemblyScript can simply have extension `.ts`.