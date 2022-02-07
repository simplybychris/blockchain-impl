# Studentchain - Implementation of the Blockchain
```
█▀▀ ▀█▀ █ █ █▀▄ █▀▀ █▀█ ▀█▀ █▀▀ █ █ █▀█ ▀█▀ █▀█
▀▀█  █  █ █ █ █ █▀▀ █ █  █  █   █▀█ █▀█  █  █ █
▀▀▀  ▀  ▀▀▀ ▀▀  ▀▀▀ ▀ ▀  ▀  ▀▀▀ ▀ ▀ ▀ ▀ ▀▀▀ ▀ ▀ 
```
## Installation
Download the project from this repository and then install the required dependencies using the command `npm install`.\
By default, the scripts responsible for running the application are defined in package.json.\
To use the ready configuration, start the main node using the command `npm run dev`
and then you can connect other nodes running `npm run dev-env` and `npm run dev-env2`.\
Nodes should connect in the configuration shown below:\
A <-> B <-> C

## Configuration
To modify values such as starting difficulty, account balance, hash rate etc. you need to change the values manually in the `config.ts` file.
