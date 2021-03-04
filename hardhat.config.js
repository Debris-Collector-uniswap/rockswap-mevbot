require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    bsctest: {
        url: 'https://data-seed-prebsc-1-s3.binance.org:8545',
        network_id: 97,
        accounts: [process.env.PRIVATE_KEY],
    },
    bsc: {
        url: 'https://bsc-dataseed1.binance.org',
        network_id: 56,
        accounts: [process.env.PRIVATE_KEY],
    }
  },
  solidity: "0.6.12",
};
