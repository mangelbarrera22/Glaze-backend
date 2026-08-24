const { ethers } = require('ethers');
const abi = require('./artifacts/contracts/GlazeMarket.sol/GlazeMarket.json').abi;

abi.forEach(f => {
  if (f.type === 'function') {
    const sig = ethers.id(f.name + '(' + f.inputs.map(i => i.type).join(',') + ')').slice(0, 10);
    console.log(sig, f.name);
  }
});