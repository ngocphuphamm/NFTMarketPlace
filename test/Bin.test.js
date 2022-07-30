// const {expect} = require("chai");
// const {ethers} = require("hardhat");

// describe("Bin NFT",()=>{
//     let [accountA,accountB,accountC] = [];
//     let contract ;
//     let address0 = "0x0000000000000000000000000000000000000000";
//     let uri = "sampleuri.com/";
//     beforeEach(async ()=>{
//         [accountA,accountB,accountC] = await ethers.getSigners();
//         const Contract = await ethers.getContractFactory("Bin");
//         contract = await Contract.deploy();
//         contract.deployed();
//     })
//     describe("mint",()=>{
//         it("should reveret if mint to zero address", async () =>{
//             await expect(contract.mint(address0)).to.be.revertedWith("ERC721: mint to the zero address");
//         })
//         it("should mint token correctly", async () =>{
//             let mintTx = await contract.mint(accountA.address);
//             await expect(mintTx).to.be.emit(contract,"Transfer").withArgs(address0,accountA.address,1);
//              expect(await contract.balanceOf(accountA.address)).to.be.equal(1);
        
        
//             let mintTx2 = await contract.mint(accountA.address);
//             await expect(mintTx2).to.be.emit(contract,"Transfer").withArgs(address0,accountA.address,2);
//              expect(await contract.balanceOf(accountA.address)).to.be.equal(2);
//         })
//     })  
//     describe("updateBaseTokenURI",()=>{
//         it("should update Base Token URI correctly", async () =>{
//             await contract.mint(accountA.address);
//             await contract._updateBaseURI(uri);
//             expect(await contract.tokenURI(1)).to.be.equal(uri + "1");
//         })
//     })



// })