// function deployFunc() {
//     console.log("hi")
//      hre.getNameAccounts()
//      hre.deployments
// }

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
// module.exports.default = deployFunc
const { verify } = require("../utils/verify")

//方式二
// module.exports = async (hre) => {
//     const {getNameAccounts,deployments} = hre;
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    //当使用本地主机或者hardhat network时，我们使用mock

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    const args = [ethUsdPriceFeedAddress]

    if (!developmentChains.includes(network.name)) {
        await verify(fundMe.address, args)
    }

    log("----------------------")
}
module.exports.tags = ["all", "fundme"]
