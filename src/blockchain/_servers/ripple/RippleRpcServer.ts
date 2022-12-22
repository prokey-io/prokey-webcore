import { BaseBlockchainServer } from '../BaseBlockchainServer';
import { BlockchainServerModel } from '../../BlockchainProviders';
import {
    RippleAccountInfo,
    RippleAccountTransactionResponse,
    RippleFee,
    RippleTransactionDataInfo,
    RippleTransactionResponse,
} from './RippleRpcModel';
import * as Utils from '../../../utils/utils';

export class RippleProkeyServer extends BaseBlockchainServer {
    /**
     * Get information about an address
     * @param server Server Model
     * @param address address
     */
    public static async GetAddressInfo(server: BlockchainServerModel, address: string): Promise<RippleAccountInfo> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'account_info', // method
            {
                // params
                account: address,
                strict: true,
                ledger_index: 'current',
                queue: false,
            }
        );

        if (res == null || res.result == null) {
            Promise.reject('No valid response from the server');
        }

        return res.result;
    }

    /**
     * Broadcasting the transaction
     * @param server Server Model
     * @param data Signed data to be broadcasted to network
     * @returns
     */
    public static async BroadCastTransaction(
        server: BlockchainServerModel,
        data: string
    ): Promise<RippleTransactionResponse> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'submit', // method
            {
                // params
                tx_blob: data,
            }
        );

        return res.result;
    }

    /**
     * Getting list of transaction info
     * @param server Server Model
     * @param account Account address
     * @param limit Number of transactions
     * @returns List of ripple transaction data
     */
    public static async GetAccountTransactions(
        server: BlockchainServerModel,
        account: string,
        limit: number = 10
    ): Promise<Array<RippleTransactionDataInfo>> {
        let trs = await this.GetFromServer<RippleAccountTransactionResponse>(
            `${server.url}/account/transactions?accountAddress=${account}&pageSize${limit}`
        );
        if (trs != null && trs.transactions != null) {
            return trs.transactions;
        }
        return [];
    }

    /**
     * Getting current fee
     * @returns Ripple Fee
     */
    public static async GetCurrentFee(server: BlockchainServerModel): Promise<RippleFee> {
        return await this.GetFromServer<RippleFee>(`${server.url}/transaction/fee`);
    }

    private static async SendTransaction(
        server: BlockchainServerModel,
        data: string
    ): Promise<RippleTransactionResponse> {
        return await this.GetFromServer<RippleTransactionResponse>(`${server.url}/transaction/submit/${data}`);
    }
}
