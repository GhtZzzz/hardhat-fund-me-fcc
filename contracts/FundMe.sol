// SPDX-License-Identifier: MIT

//pragma
pragma solidity ^0.8.8;

//import
import "./PriceConverter.sol";

//error codes --添加合约名称，一些下划线，然后是错误类型的名称
error FundMe__NotOwner();

//Interface,Libraries,Contract

/**
 * @title A contract for crowd funding
 * @author (作者)
 * @notice This contract is to demo a sample funding contract
 */
contract FundMe {
    //类型声明(Type Declarations)开始
    using PriceConverter for uint256;

    //State Variables
    uint256 public constant MINIMUM_USD = 5 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) public s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == i_owner,"sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeed) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    /**
     * @notice This function funds this  contract
     * @dev This implements price feeds as our library
     */
    function fund() public payable {
        require(
            msg.value.getCoversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        //mapping can't be in memory!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }
}
