const { assert, expect } = require('chai');
const { BigNumber, Contract } = require('ethers');
const { ethers, web3 } = require("hardhat");
const Web3 = require('web3')

require('chai')
  .use(require('chai-as-promised'))
  .should()

let Spookypets;
let contract;
let accounts;

before(async () => {
  Spookypets = await ethers.getContractFactory("SpookyPets");
  contract = await Spookypets.deploy("");
  accounts = await ethers.getSigners();
})

describe('deployment', async () => {
  it('deploys successfully', async () => {
    const address = contract.address
    assert.notEqual(address, '0x0')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
    assert.notEqual(address, '')
  })

  it('has a name', async () => {
    const name = await contract.name()
    assert.equal(name, 'SpookyPets')
  })

  it('has a symbol', async () => {
    const symbol = await contract.symbol()
    assert.equal(symbol, 'SP')
  })
})

describe('minting', async () => {
  it('can mint 1 token', async () => {
    const contractAddress = contract.address;
    const mintCount = 1;
    const currentSupply = await contract.totalSupply();
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('60', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount]),
    };
    const result = await accounts[0].sendTransaction(tx);

    const totalSupply = await contract.totalSupply();
    // SUCCESS
    assert.equal(BigNumber.from(totalSupply).toNumber(), BigNumber.from(currentSupply).toNumber() + mintCount)
  })

  it('can mint 5 tokens', async () => {
    const mintCount = 5;
    const contractAddress = contract.address;
    const currentSupply = await contract.totalSupply();
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('300', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount]),
    };
    const result = await accounts[0].sendTransaction(tx);

    const totalSupply = await contract.totalSupply();
    // SUCCESS
    assert.equal(BigNumber.from(totalSupply).toNumber(), BigNumber.from(currentSupply).toNumber() + mintCount)
  })

  it('account has balance of totalSupply', async () => {
    const balance = await contract.balanceOf(accounts[0].address)

    for (let i = 0; i < balance; i++) {
      const token = await contract.tokenOfOwnerByIndex(accounts[0].address, i);
      const tokenURI = await contract.tokenURI(token.toNumber())
    }

    const totalSupply = await contract.totalSupply()

    // success
    assert.equal(BigNumber.from(balance).toNumber(), BigNumber.from(totalSupply).toNumber(), `has ${totalSupply} token balance`);
  })
})

describe('withdraw', async () => {
  it('allows withdrawing all funds', async () => {
    await contract.withdrawAll();
  })
})

describe('reserve mints', async () => {
  it('allows reserving a set number of tokens', async () => {
    const prevSupply = await contract.totalSupply();

    await contract.reserveForOwner();

    const reserve = await contract.RESERVE();
    const totalSupply = await contract.totalSupply();

    assert.equal(totalSupply.toNumber(), reserve.toNumber() + prevSupply.toNumber(), 'total supply is equivalent to reserve + previous mint count');
  })

  it('reserve mints correctly generates different variations', async () => {
    const token2 = await contract.tokenOfOwnerByIndex(accounts[0].address, 1);
    const token3 = await contract.tokenOfOwnerByIndex(accounts[0].address, 2);

    assert.notEqual(BigNumber.from(token2).toNumber(), BigNumber.from(token3).toNumber());
  })

  it('can\'t reserve twice', async () => {
    await expect(contract.reserveForOwner()).to.eventually.be.rejected;
  })
})

describe('pause', async () => {
  it('can pause contract', async () => {
    await expect(contract.setPause(true)).to.eventually.be.fulfilled;

    const contractAddress = contract.address;
    const mintCount = 1;
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('60', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount]),
    };
    await expect(accounts[0].sendTransaction(tx)).to.eventually.be.rejected;
  })

  it('can unpause contract', async () => {
    // todo: need to ensure all tokens are minted before attempting to lock, or it will fail
    await expect(contract.setPause(false)).to.eventually.be.fulfilled;

    const contractAddress = contract.address;
    const mintCount = 1;
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('60', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount]),
    };
    await expect(accounts[0].sendTransaction(tx)).to.eventually.be.fulfilled;
  })
})

describe('lock', async () => {
  it('can\'t lock', async () => {
    await expect(contract.lock()).to.eventually.be.rejected
  })

  // it('can lock', async () => {
  //   // todo: need to ensure all tokens are minted before attempting to lock, or it will fail
  //   await contract.lock();
  // })

  // it('cannot change baseuri after locking', async () => {
  //   // todo: need to ensure previous test to lock works so this will be rejected
  //   await expect(contract.setBaseURI('https://example.com')).to.eventually.be.rejected
  // })
})

describe('burn', async () => {
  it('can burn token', async () => {
    const prevTokenAtIndex2 = await contract.tokenOfOwnerByIndex(accounts[0].address, 2)

    await expect(contract.burn(prevTokenAtIndex2.toNumber())).to.eventually.be.fulfilled

    const newTokenAtIndex2 = await contract.tokenOfOwnerByIndex(accounts[0].address, 2)

    assert.notEqual(newTokenAtIndex2.toNumber(), prevTokenAtIndex2.toNumber())
  })

  it('burned token is sent to null address', async () => {
    await expect(contract.ownerOf(2)).to.eventually.be.rejected
  })
})