const { ethers, getNamedAccounts, deployments, network } = require("hardhat")
const { assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

// let variable = true
// let someVar = variable ? "yes" : "no"
// if(variable){someVar="yes"}else{someVar="no"}

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseEther("0.03")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              const fundMeDeployment = await deployments.get("FundMe")

              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeDeployment.address,
              )
          })

          it("allows people to fund and withdraw", async function () {
              const fundMeAddress = await fundMe.getAddress()

              const fundTransactionResponse = await fundMe.fund({
                  value: sendValue,
              })

              await fundTransactionResponse.wait(1)

              const withdrawTransactionResponse = await fundMe.withdraw()
              await withdrawTransactionResponse.wait(1)

              const endingFundMeBalance = await ethers.provider.getBalance(
                  fundMeAddress,
              )
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
