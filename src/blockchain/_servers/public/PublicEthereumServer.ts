import { FeeData, JsonRpcProvider, Provider } from '@ethersproject/providers';
import { BlockchainServerModel } from '../../BlockchainProviders';
import * as WalletModel from '../../../models/EthereumWalletModel';
import { Erc20BaseCoinInfoModel, EthereumBaseCoinInfoModel } from '../../../models/CoinInfoModel';
import { Contract } from '@ethersproject/contracts';
import ERC20_ABI from '../../../../data/erc20.abi.json';
import { GetGasParams } from '../../../utils/ethereum-providers';
import { BlockbookTransactionResult } from '../blockbook/BlockbookCommonModel';

class PublicEthereumServer {
    static async GetAddressInfo(
        server: BlockchainServerModel,
        address: string,
        isErc20: boolean,
        coinInfo: Erc20BaseCoinInfoModel | EthereumBaseCoinInfoModel | undefined
    ): Promise<WalletModel.EthereumAccountInfo> {
        const provider = new JsonRpcProvider(server.url);

        let balance = '0';
        let tokenBalance = '0';
        if (isErc20) {
            const erc20CoinInfo = coinInfo as Erc20BaseCoinInfoModel;
            const contract = new Contract(erc20CoinInfo.address, ERC20_ABI, provider);
            const addressBalance = (await contract.balanceOf(address)).toString();
            tokenBalance = addressBalance;
        }
        balance = (await provider.getBalance(address)).toString();
        const nonce = (await provider.getTransactionCount(address)).toString();

        const accInfo: WalletModel.EthereumAccountInfo = {
            address,
            balance: isErc20 ? tokenBalance : balance,
            nonce,
            unconfirmedBalance: '0',
            nonTokenTxs: 0,
            txs: 0,
            unconfirmedTxs: 0,
            tokens: [],
            transactions: [],
        };
        if (isErc20) {
            accInfo.ethBalance = balance;
        }
        return accInfo;
    }

    public async GetFeeData(chainId: number): Promise<FeeData> {
        return await GetGasParams(chainId);
    }

    public static async BroadcastTransaction(
        server: BlockchainServerModel,
        transaction: string
    ): Promise<BlockbookTransactionResult> {
        const provider = new JsonRpcProvider(server.url);
        try {
            const txResult = await provider.sendTransaction(transaction);
            return {
                result: txResult.hash,
            };
        } catch (e: any) {
            return {
                error: e.reason,
            };
        }
    }
}

export default PublicEthereumServer;
