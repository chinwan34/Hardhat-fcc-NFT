// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

// Function selector: First 4 bytes of function signature
// Function signature: A string that defines function name and parameters

contract CallAnything {
    address public s_someAddress;
    uint256 public s_amount;

    // Function signature: transfer(address,uint256)
    function transfer(address someAddress, uint256 amount) public {
        s_someAddress = someAddress;
        s_amount = amount;
    }

    // To get the selectors
    function getSelectorOne() public pure returns (bytes4 selector) {
        selector = bytes4(keccak256(bytes("transfer(address,uint256)")));
    }

    // To get data for the transfer function
    function getDataToCallTransfer(
        address someAddress,
        uint256 amount
    ) public pure returns (bytes memory) {
        // abi.encodeWithSelector: encodes the given arguments starting
        return abi.encodeWithSelector(getSelectorOne(), someAddress, amount);
    }

    function callTransferFunctionDirectly(
        address someAddress,
        uint256 amount
    ) public returns (bytes4, bool) {
        (bool success, bytes memory returnData) = address(this).call(
            //getDataToCallTransfer(someAddress, amount);
            abi.encodeWithSelector(getSelectorOne(), someAddress, amount)
        );
        return (bytes4(returnData), success);
    }

    function callTransferFunctionDirectly2(
        address someAddress,
        uint256 amount
    ) public returns (bytes4, bool) {
        (bool success, bytes memory returnData) = address(this).call(
            //getDataToCallTransfer(someAddress, amount);
            abi.encodeWithSignature(
                "transfer(address,uint256",
                someAddress,
                amount
            )
        );
        return (bytes4(returnData), success);
    }

    // There are other types of ways to get the selectors
}
