const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          let fundMeAddress
          let sendValue = ethers.parseEther("1") //"1000000000000000000" //1eth

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              const deploymentsResults = await deployments.fixture(["all"])

              fundMeAddress = deploymentsResults["FundMe"].address
              fundMe = await ethers.getContractAt("FundMe", fundMeAddress)
              const mockV3AggregatorAddress =
                  deploymentsResults["MockV3Aggregator"]?.address
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorAddress,
              )
          })

          describe("constructor", async function () {
              it("sets the addregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()

                  assert.equal(response, await mockV3Aggregator.getAddress())
              })
          })

          describe("fund", async function () {
              it("Fail if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!",
                  )
              })

              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer,
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("Withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      )
                  const startingDeployerBanlance =
                      await ethers.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBanlance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )
              })

              it("allows us to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  //assert
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress,
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )
                  //funders可以正确重置
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Only allows the owner to with withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker,
                  )
                  await expect(
                      attackerConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function () {
                  const accounts = await ethers.getSigners()

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFMBalance = await ethers.provider.getBalance(
                      fundMeAddress,
                  )
                  const startingDepBalance = await ethers.provider.getBalance(
                      deployer,
                  )
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt

                  const gasCost = gasUsed * gasPrice

                  const endingFMBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  )
                  const endingDepBalance = await ethers.provider.getBalance(
                      deployer,
                  )

                  assert.equal(endingFMBalance, 0)
                  assert.equal(
                      (startingFMBalance + startingDepBalance).toString(),
                      (endingDepBalance + gasCost).toString(),
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
          })
      })
