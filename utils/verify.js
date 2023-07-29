const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("allready verified")) {
            console.log("Allready verified")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
