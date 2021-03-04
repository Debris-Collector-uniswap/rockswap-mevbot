
const { time } = require('@openzeppelin/test-helpers');
const hre = require("hardhat");

const ethers = hre.ethers;

const Timelock = require('../artifacts/contracts/Timelock.sol/Timelock.json');
const Masterchef = require('../artifacts/contracts/MasterChef.sol/MasterChef.json');

const TIMELOCK_ADDRESS = '0xa177db11aE86bB196c75b47B03dF2CDb0197DB7D'; // change for the right address
const MASTERCHEF_ADDRESS = '0x7522E0751A9583cf7420e7357BAa52f8a6cdeF0A'; // change for the right address

const ETA = 3614207600; // Change for the right ETA

function encodeParameters(types, values) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

async function queueUpdateEmission(timelock, masterchefAddress, newEmissions) {
    // updateEmissionRate(uint256 _rockPerBlock)
    await timelock.queueTransaction(
        masterchefAddress,
        '0',
        'updateEmissionRate(uint256)',
        encodeParameters(['uint256'], [ethers.BigNumber.from(newEmissions).mul(ethers.BigNumber.from(String(10**18)))]),
        ETA,
    );

    const encodedParams = encodeParameters(['uint256'], [ethers.BigNumber.from(newEmissions).mul(ethers.BigNumber.from(String(10**18)))]);
    const abiCoder = ethers.utils.defaultAbiCoder;
    const hash = ethers.utils.keccak256(abiCoder.encode(
            ['address', 'uint256', 'string', 'bytes', 'uint256'],
            [masterchefAddress, '0', 'updateEmissionRate(uint256)', encodedParams, ETA]
        )
    );

    console.log('is queued: ', await timelock.queuedTransactions(hash));
}

async function executeUpdateEmissions(timelock, masterChefAddress, newEmissions) {
    // updateEmissionRate(uint256 _rockPerBlock)
    await timelock.executeTransaction(
        masterChefAddress,
        '0',
        'updateEmissionRate(uint256)',
        encodeParameters(['uint256'], [ethers.BigNumber.from(newEmissions).mul(ethers.BigNumber.from(String(10**18)))]),
        ETA,
    );

    const encodedParams = encodeParameters(['uint256'], [ethers.BigNumber.from(newEmissions).mul(ethers.BigNumber.from(String(10**18)))]);
    const abiCoder = ethers.utils.defaultAbiCoder;
    const hash = ethers.utils.keccak256(abiCoder.encode(
            ['address', 'uint256', 'string', 'bytes', 'uint256'],
            [masterChefAddress, '0', 'updateEmissionRate(uint256)', encodedParams, ETA]
        )
    );

    console.log('is queued: ', await timelock.queuedTransactions(hash));
}

async function main() {
    const [deployer] = await ethers.getSigners();

    const timelock = new ethers.Contract(TIMELOCK_ADDRESS, Timelock.abi, deployer);
    const masterchef = new ethers.Contract(MASTERCHEF_ADDRESS, Masterchef.abi, deployer);

    // add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate)


    await queueUpdateEmission(timelock, masterchef.address, '2');
    //await executeUpdateEmissions(timelock, masterchef.address, '2'); Have to wait 24 hours from the time it's queued
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
