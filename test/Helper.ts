import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Helper", async function () {
  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  let MATContract: any;
  let MBTContract: any;

  let RouterContract: any;
  let FactoryContract: any;
  let pairContract: any;

  let LPContractAddress: string;

  const mintAmountMAT = 10000;
  const mintAmountMBT = 20000;

  const transferAmountToOtherAccount = 4000;

  const initLPamountTokenA = 5000;
  const initLPamountTokenB = 10000;

  before(async function () {
    [owner, otherAccount] = await ethers.getSigners();
  });

  it("mintAndTransferTokens", async function () {
    //mint MAT Token
    const MAT = await ethers.getContractFactory("MAT");

    MATContract = await MAT.deploy(mintAmountMAT);
    const MATsupply = (await MATContract.totalSupply()).toString();

    //transfer MAT Token
    await MATContract.transfer(
      otherAccount.address,
      transferAmountToOtherAccount
    );
    const otherAccountMatBalance = await MATContract.balanceOf(
      otherAccount.address
    );

    expect(otherAccountMatBalance).to.equal(transferAmountToOtherAccount);

    //mint MBT Token
    const MBT = await ethers.getContractFactory("MBT");

    MBTContract = await MBT.deploy(mintAmountMBT);
    const MBTsupply = (await MBTContract.totalSupply()).toString();

    console.log("");
    console.log("Test token Mint");
    console.log("MAT mint : ", MATsupply);
    console.log("MBT mint : ", MBTsupply);

    const ownerTokenA_amount = (
      await MATContract.balanceOf(owner.address)
    ).toString();
    const ownerTokenB_amount = (
      await MBTContract.balanceOf(owner.address)
    ).toString();
    const otherTokenA_amount = (
      await MATContract.balanceOf(otherAccount.address)
    ).toString();
    const otherTokenB_amount = (
      await MBTContract.balanceOf(otherAccount.address)
    ).toString();

    console.log("");
    console.log("token amount");
    console.log("");
    console.log("owner : ", owner.address);
    console.log(
      `tokenA : ${ownerTokenA_amount}, tokenB : ${ownerTokenB_amount}`
    );
    console.log("");
    console.log("other : ", otherAccount.address);
    console.log(
      `tokenA : ${otherTokenA_amount}, tokenB : ${otherTokenB_amount}`
    );

    expect(ownerTokenA_amount).to.equal(
      (mintAmountMAT - transferAmountToOtherAccount).toString()
    );
    expect(ownerTokenB_amount).to.equal(mintAmountMBT.toString());
    expect(otherTokenA_amount).to.equal(
      transferAmountToOtherAccount.toString()
    );
    expect(otherTokenB_amount).to.equal("0");
  });

  it("preAddLiquidity", async function () {
    //test전 미리 유동성 풀을 만든다.
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    FactoryContract = await Factory.deploy(owner.address);

    const Router = await ethers.getContractFactory("UniswapV2Router");
    RouterContract = await Router.deploy(
      FactoryContract.address,
      otherAccount.address
    );

    const latestBlock = await ethers.provider.getBlock("latest");

    // MAT : MBT  =>  1:2 비율로 유동성 공급. 초기 세팅
    const MATLiquidityAmount = initLPamountTokenA;
    const MBTLiquidityAmount = initLPamountTokenB;

    //approve
    await MATContract.approve(RouterContract.address, initLPamountTokenA);
    await MBTContract.approve(RouterContract.address, initLPamountTokenB);

    await RouterContract.addLiquidity(
      MATContract.address,
      MBTContract.address,
      MATLiquidityAmount,
      MBTLiquidityAmount,
      0,
      0,
      owner.address,
      latestBlock.timestamp + 10
    );

    LPContractAddress = await FactoryContract.getPair(
      MATContract.address,
      MBTContract.address
    );

    pairContract = await hre.ethers.getContractAt(
      "UniswapV2Pair",
      LPContractAddress
    );

    const res = await pairContract.getReserves();
    const tokenA_amount = res[0].toString();
    const tokenB_amount = res[1].toString();

    console.log("");
    console.log("");
    console.log("======================================================");
    console.log("lp pool init addLiquidity result (MAT:MBT)");
    console.log(`${tokenA_amount}:${tokenB_amount}`);
    console.log("");

    expect(tokenA_amount).to.equal(initLPamountTokenA.toString());
    expect(tokenB_amount).to.equal(initLPamountTokenB.toString());
  });

  it("Helpertest", async function () {
    const Helper = await ethers.getContractFactory("Helper");
    const helperContract = await Helper.deploy(RouterContract.address);

    // 예치할 금액
    const depositAmount = "1000";

    await MATContract.connect(otherAccount).approve(
      helperContract.address,
      depositAmount
    );

    const latestBlock = await ethers.provider.getBlock("latest");

    const beforeLPamount = (
      await pairContract.balanceOf(otherAccount.address)
    ).toString();

    await helperContract
      .connect(otherAccount)
      .singleTokenAddLiquidity(
        LPContractAddress,
        MATContract.address,
        depositAmount,
        otherAccount.address,
        latestBlock.timestamp + 10
      );

    const afterLPamount = (
      await pairContract.balanceOf(otherAccount.address)
    ).toString();

    console.log("");
    console.log("");
    console.log("======================================================");
    console.log("Test result.");
    console.log("");
    console.log("LP amount (before -> after)");
    console.log(`${beforeLPamount}-> ${afterLPamount}`);

    expect(Number(afterLPamount)).to.above(0);

    const res = await pairContract.getReserves();
    const tokenA_amount = res[0].toString();
    const tokenB_amount = res[1].toString();

    console.log("");
    console.log("lp pool result (MAT:MBT)");
    console.log(`${tokenA_amount}:${tokenB_amount}`);
    console.log("");

    const remainTokenA = (
      await MATContract.balanceOf(helperContract.address)
    ).toString();
    const remainTokenB = (
      await MATContract.balanceOf(helperContract.address)
    ).toString();

    console.log("helper contract remain token");
    console.log("tokenA : ", remainTokenA);
    console.log("tokenB : ", remainTokenB);

    expect(remainTokenA).to.equal("0");
    expect(remainTokenB).to.equal("0");
  });
});
