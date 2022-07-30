// const {expect } = require("chai");
// const {ethers} = require("hardhat");
// describe("PNP",async ()=>{
//     let [accountA,accountB,accountC] = [];
//     let contract ;
//     let amount = ethers.utils.parseUnits("100","ether");
//     let address0 = "0x0000000000000000000000000000000000000000";
//     let totalSupply = ethers.utils.parseUnits("1000000","ether");

//     beforeEach(async ()=>{
//         [accountA,accountB,accountC] = await ethers.getSigners();
//         let Contract = await ethers.getContractFactory("PNP");
//         contract = await Contract.deploy();
//         await contract.deployed();
//     })  

//     describe("common", () =>{
//         it("total supply should return right value ", async ()=>{
//             expect(await contract.totalSupply()).to.be.equal(totalSupply);
//         });
//         it("balance of account A should return right",async ()=>{
//             expect(await contract.balanceOf(accountA.address)).to.be.equal(totalSupply);
//         });
//         it("balance of account B should return value ", async () =>{
//             expect(await contract.balanceOf(accountB.address)).to.be.equal(0);
//         })
//     })
//     describe("pause()",()=>{
//         it("should revert if not pauser role ",async function (){
//             await expect(contract.connect(accountB).pause()).to.be.reverted;
//         });
//         it("should revert if contract has been paused", async ()=>{
//             await contract.pause();
//             await expect(contract.pause()).to.be.revertedWith("Pausable: paused")
//         })
//         it("should pause contract correctly", async ()=>{
//             const pauseTx = await contract.pause();
//             await expect(pauseTx).to.be.emit(contract,"Paused").withArgs(accountA.address);
//             // kiem tra da that su pause chua 
//             await expect(contract.transfer(accountB.address,amount)).to.be.revertedWith("Pausable: paused");
//         })
//     })
//     describe("unpause()",async ()=>{
//         beforeEach(async ()=>{
//             await contract.pause();
//         })
//         it("should revert if not pauser role ",async () => {
//             await expect(contract.connect(accountB).unpause()).to.be.reverted;
//         })
//         it("should revert if contract has been unpause",async ()=>{
//             await contract.unpause();
//             await expect(contract.unpause()).to.be.revertedWith("Pausable: not paused");
//         })
//         it("should pause contract correctly",async ()=>{
//             const unpauseTx = await contract.unpause();
//             await expect(unpauseTx).to.be.emit(contract,"Unpaused").withArgs(accountA.address);
//             let transferTx = await contract.transfer(accountB.address,amount);
//             await expect(transferTx).to.be.emit(contract,'Transfer').withArgs(accountA.address,accountB.address,amount);

//         })
//     })
//     describe("addToBlackList()",()=>{
//         it("should revert in case add sender to blacklist", async ()=>{
//             await expect(contract.addToBlackList(accountA.address)).to.be.revertedWith("PNP: must not add sender to black list");
//         })
//         it("should revert if account has been added to blacklist", async ()=>{
//             await contract.addToBlackList(accountB.address);
//             await expect(contract.addToBlackList(accountB.address)).to.be.revertedWith("PNP : ACCOUNT WAS ON BLACKLIST");
//         })
//         it("should revert if not admin role ", async ()=>{
//             await expect(contract.connect(accountB.address).addToBlackList(accountC.address)).to.be.reverted
//         })
//         it("should add to blacklist correctly",async ()=>{
//             contract.transfer(accountB.address,amount);
//             contract.transfer(accountC.address,amount);
//             await contract.addToBlackList(accountB.address);
//             await expect(contract.connect(accountB).transfer(accountC.address,amount)).to.be.reverted;
//             await expect(contract.connect(accountC).transfer(accountB.address,amount)).to.be.reverted;
//         })
//     })
//     describe("removeBlackList()",() =>{ 
//         beforeEach(async ()=>{
//             contract.transfer(accountB.address,amount)
//             contract.transfer(accountC.address,amount)
//             await contract.addToBlackList(accountB.address)
//         })
//         it("should revert if account has not been added to blacklist", async ()=>{
//             await contract.removeBlackList(accountB.address);
//             await expect(contract.removeBlackList(accountB.address)).to.be.revertedWith("PNP : ACCOUNT WAS not ON BLACKLIST");
//         })
//         it("should revert if not admin role ", async () =>{
//             await expect(contract.connnect(accountB.address).removeBlackList(accountC.address)).to.be.reverted;
//         })
//         it("should remove from black list correctly",async ()=>{
//             await contract.removeBlackList(accountB.address)
//             let transferTx = await contract.transfer(accountB.address,amount)
//             await expect(transferTx).to.emit(contract,"Transfer").withArgs(accountA.address,accountB.address,amount);
//         })
//     })
// })