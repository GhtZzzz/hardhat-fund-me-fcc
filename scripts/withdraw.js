const { deployments } = require("hardhat")

async function main() {
    const fundMeDeployment = await deployments.get("FundMe")
    console.log("Funding...")
    const fundMe = await ethers.getContractAt(
        "FundMe",
        fundMeDeployment.address,
    )
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait()
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
