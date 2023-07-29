const { deployments, ethers } = require("hardhat")

async function main() {
    const fundMeDeployment = await deployments.get("FundMe")
    console.log("Funding Contract...")

    const fundMe = await ethers.getContractAt(
        "FundMe",
        fundMeDeployment.address,
    )

    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.01"),
    })

    await transactionResponse.wait()
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
