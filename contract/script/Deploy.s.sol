// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StudentID} from "../src/StudentID.sol";
import {LendingPool} from "../src/LendingPool.sol";

contract DeployScript is Script {
    function run() external broadcast {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");

        StudentID sid = new StudentID(deployer);
        console.log("StudentID deployed at:", address(sid));

        LendingPool pool = new LendingPool(address(sid));
        console.log("LendingPool deployed at:", address(pool));

        // LendingPool'u StudentID admin yap (temerrüt revoke için)
        sid.setAdmin(address(pool), true);
        console.log("LendingPool set as StudentID admin");
    }

    modifier broadcast() {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        _;
        vm.stopBroadcast();
    }
}
