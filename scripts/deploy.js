const hre = require("hardhat");

const ethers = hre.ethers;

const PancakeFactory = require('./FactoryABI.json');

const PANCAKE_FACTORY_MAINET = '0xBCfCcbde45cE874adCB698cC183deBcF17952812';
const PANCAKE_FACTORY_TESTNET = '0xF407cd098c8FD46929ECeFEC28dcC5CBf064A578';

const DEV_ADDR = '0x8347B6948e062837c0aa35b14275e827c796b577';
const FEE_ADDR = '0x8347B6948e062837c0aa35b14275e827c796b577';

const ROCK_PER_BLOCK = '4';
const STARTING_BLOCK = 5369200;
const REWARDS_START_BLOCK = String(STARTING_BLOCK);

const TIMELOCK_DELAY_SECS = (3600 * 24);

// Tokens on mainnet
const BUSD_ADDRESS = '0xe9e7cea3dedca5984780bafc599bd69add087d56';
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const USDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955';
const BBTC_ADDRESS = '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c';
const ETH_ADDRESS = '0x2170ed0880ac9a755fd29b2688956bd959f933f8';
const DAI_ADDRESS = '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3';
const DOT_ADDRESS = '0x7083609fce4d1d8dc0c979aab8c869ea2c873402';
const CAKE_ADDRESS = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82';
const AUTO_ADDRESS = '0xa184088a740c695e156f91f5cc086a06bb78b827';
const EGG_ADDRESS = '0xf952fc3ca7325cc27d15885d37117676d25bfda6';

// LP's on mainnet
const BNB_BUSD_ADDRESS = '0x1b96b92314c44b159149f7e0303511fb2fc4774f';
const BBTC_BNB_ADDRESS = '0x7561eee90e24f3b348e1087a005f78b4c8453524';
const ETH_BNB_ADDRESS = '0x70d8929d04b60af4fb9b58713ebcf18765ade422';
const USDT_BUSD_ADDRESS = '0xc15fa3e22c912a276550f3e5fe3b0deb87b55acd';
const DAI_BUSD_ADDRESS = '0x3ab77e40340ab084c3e23be8e5a6f7afed9d41dc';
const USDC_BUSD_ADDRESS = '0x680dd100e4b394bda26a59dd5c119a391e747d18';
const DOT_BNB_ADDRESS = '0xbcd62661a6b1ded703585d3af7d7649ef4dcdb5c';
const CAKE_BUSD_ADDRESS = '0x0ed8e0a2d99643e1e65cca22ed4424090b8b7458';
const CAKE_BNB_ADDRESS = '0xa527a61703d82139f8a06bc30097cc9caa2df5a6';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployRock() {
    const Rock = await ethers.getContractFactory('RockToken');

    const rock = await Rock.deploy();

    return rock;
}

async function deployMasterChef(rockAddress) {
    const MasterChef = await ethers.getContractFactory('MasterChef');

    const masterchef = await MasterChef.deploy(
        rockAddress,
        DEV_ADDR,
        FEE_ADDR,
        ethers.BigNumber.from(ROCK_PER_BLOCK).mul(ethers.BigNumber.from(String(10**18))),
        REWARDS_START_BLOCK
    );

    return masterchef;
}

async function deployTimelock() {
    const Timelock = await ethers.getContractFactory('Timelock');

    const timelock = await Timelock.deploy(DEV_ADDR, TIMELOCK_DELAY_SECS);

    return timelock;
}

async function deployTokens() {
    const Token = await ethers.getContractFactory('MockBEP20');

    const busd = await Token.deploy('BUSD', 'BUSD', ethers.BigNumber.from('1000'));
    const bnb = await Token.deploy('BNB', 'BNB', ethers.BigNumber.from('1000'));

    return [busd, bnb];
}

async function createLP(deployer, factoryAddress, tokenAddressA, tokenAddressB) {
    const factory = new ethers.Contract(factoryAddress, PancakeFactory, deployer);

    await factory.createPair(tokenAddressA, tokenAddressB);

    // wait
    await sleep(10000);

    const pair = await factory.getPair(tokenAddressA, tokenAddressB);
    return pair;
}

async function addLP(masterchef, allocPoint, lp, depositFee) {
    // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate)
    await masterchef.add(allocPoint, lp, depositFee, true);
}

async function testnetRelease(deployer, masterchef, rock, bnb, busd) {
    const bnbbusd = await createLP(deployer, PANCAKE_FACTORY_TESTNET, bnb.address, busd.address); // only for testnet
    const rockbnb = await createLP(deployer, PANCAKE_FACTORY_TESTNET, rock.address, bnb.address);
    const rockbusd = await createLP(deployer, PANCAKE_FACTORY_TESTNET, rock.address, busd.address);

    console.log('bnbbusd', bnbbusd)
    console.log('rockbnb', rockbnb)
    console.log('rockbusd', rockbusd)

    await addLP(masterchef, '1000', rock.address, '0', true); // add ROCK pool to masterchef
    await addLP(masterchef, '1000', rockbnb, '0', true); // add ROCK-BNB pool to masterchef
    await addLP(masterchef, '1000', rockbusd, '0', true); // add ROCK-BUSD pool to masterchef
    await addLP(masterchef, '1000', bnbbusd, '0', true); // add ROCK-BUSD pool to masterchef
}

async function mainnetRelease(deployer, masterchef, rock) {
    const rockbnb = await createLP(deployer, PANCAKE_FACTORY_MAINET, rock.address, WBNB_ADDRESS);
    const rockbusd = await createLP(deployer, PANCAKE_FACTORY_MAINET, rock.address, BUSD_ADDRESS);

    // -- Pools --
    await addLP(masterchef, '1000', rock.address, '0', true);         // add ROCK pool to masterchef
    await addLP(masterchef, '200', BUSD_ADDRESS, '400', true);        // add BUSD pool to masterchef
    await addLP(masterchef, '300', WBNB_ADDRESS, '400', true);        // add WBNB pool to masterchef

    /*await addLP(masterchef, '100', USDT_ADDRESS, '400', true);        // add USDT pool to masterchef
    await addLP(masterchef, '200', BBTC_ADDRESS, '400', true);        // add BBTC pool to masterchef
    await addLP(masterchef, '200', ETH_ADDRESS, '400', true);         // add ETH pool to masterchef
    await addLP(masterchef, '100', DAI_ADDRESS, '400', true);         // add DAI pool to masterchef
    await addLP(masterchef, '200', DOT_ADDRESS, '400', true);         // add DOT pool to masterchef
    await addLP(masterchef, '200', CAKE_ADDRESS, '400', true);        // add CAKE pool to masterchef
    await addLP(masterchef, '300', AUTO_ADDRESS, '400', true);        // add AUTO pool to masterchef
    await addLP(masterchef, '300', EGG_ADDRESS, '400', true);         // add EGG pool to masterchef
    */

    // -- Farms --
    await addLP(masterchef, '4000', rockbnb, '0', true);            // add ROCK-BNB farm to masterchef
    await addLP(masterchef, '2400', rockbusd, '0', true);           // add ROCK-BUSD farm to masterchef

    await addLP(masterchef, '400', BNB_BUSD_ADDRESS, '400', true);    // add BNB-BUSD farm to masterchef

    /*
    await addLP(masterchef, '600', BBTC_BNB_ADDRESS, '400', true);    // add BBTC-BNB farm to masterchef
    await addLP(masterchef, '600', ETH_BNB_ADDRESS, '400', true);     // add ETH-BNB farm to masterchef
    await addLP(masterchef, '400', USDT_BUSD_ADDRESS, '400', true);   // add USDT-BUSD farm to masterchef
    await addLP(masterchef, '400', DAI_BUSD_ADDRESS, '400', true);    // add DAI-BUSD farm to masterchef
    await addLP(masterchef, '400', USDC_BUSD_ADDRESS, '400', true);   // add USDC-BUSD farm to masterchef
    await addLP(masterchef, '600', DOT_BNB_ADDRESS, '400', true);     // add DOT-BNB farm to masterchef

    await addLP(masterchef, '200', CAKE_BUSD_ADDRESS, '400', true);   // add CAKE-BUSD farm to masterchef
    await addLP(masterchef, '200', CAKE_BNB_ADDRESS, '400', true);    // add CAKE-BNB farm to masterchef
    */
}

async function main() {
  const [deployer] = await ethers.getSigners();
  //console.log(deployer)

  const rockToken = await deployRock();
  const masterchef = await deployMasterChef(rockToken.address);

  // LP's for testnet
  // const [busd, bnb] = await deployTokens(); // only for testnet
  // await testnetRelease(deployer, masterchef, rockToken, bnb, busd);

  // LP's for mainet release
  await mainnetRelease(deployer, masterchef, rockToken);

  await rockToken.transferOwnership(masterchef.address);

  const timelock = await deployTimelock();

  await masterchef.transferOwnership(timelock.address);

    console.table({
        MasterChef:masterchef.address,
        RockToken:rockToken.address,
        Timelock:timelock.address,
        // BUSD: busd.address, // only for testnet
        // BNB: bnb.address, // only for testnet
    });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
