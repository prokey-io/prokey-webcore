import {
  GetGasParams,
  EstimateGasLimit,
} from "../src/utils/ethereum-providers";

import chai from "chai";
const expect = chai.expect;
chai.use(require("chai-as-promised"));

describe("ethereum-providers test", () => {
  describe("GetGasParams function test", () => {
    it("should return gas params correctly by valid chain id", async () => {
      const gasParams = await GetGasParams(1); //Ethereum
      expect(gasParams.gasPrice).to.exist;
      expect(gasParams.maxFeePerGas).to.exist;
      expect(gasParams.maxPriorityFeePerGas).to.exist;
    });

    it("should return gas params correctly by valid chain id", async () => {
      const gasParams = await GetGasParams(56); //Binance
      expect(gasParams.gasPrice).to.exist;
      expect(gasParams.maxFeePerGas).not.to.exist;
      expect(gasParams.maxPriorityFeePerGas).not.to.exist;
    });

    it("should get rejected when chain id not founded or not valid", async () => {
      await expect(GetGasParams(55)).to.be.rejectedWith(
        "Couldn't find any provider with specified chain id."
      );
    });

    it("should return gas params correctly by valid rpc url", async () => {
      const gasParams = await GetGasParams("https://main-rpc.linkpool.io");
      expect(gasParams.gasPrice).to.exist;
      expect(gasParams.maxFeePerGas).to.exist;
      expect(gasParams.maxPriorityFeePerGas).to.exist;
    });

    it("should get rejected when url is not valid or connection takes longer than 5 seconds", async () => {
      await expect(
        GetGasParams("http://AN-INVALID-IRL.org")
      ).to.be.rejectedWith("Connection timeout");
    });
  });

  describe("EstimateGasLimit test", () => {
    const contractTransaction = {
      // Wrapped ETH address
      to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      // `function deposit() payable`
      data: "0xd0e30db0",
      value: 100000000000000
    };

    it("should estimate gas limit as 21000 because destination is an EOA", async () => {
      const transaction = {
        to: "0x299BAD0618e99487920648270eA6dBe2E7092B45",
        value: 100000000000000,
      };
      const gasLimit = await EstimateGasLimit(1, transaction);
      expect(gasLimit.toNumber()).equal(21000);
    });

    it("should estimate gas limit higher than 21000 because destination is WETH contract", async () => {
      const gasLimit = await EstimateGasLimit(1, contractTransaction);
      expect(gasLimit.toNumber()).to.be.greaterThan(21000)
    });

    it("should get rejected when chain id not founded or not valid", async () => {
      await expect(
        EstimateGasLimit(99, contractTransaction)
      ).to.be.rejectedWith("Couldn't find any provider with specified chain id.");
    });
  });
});
