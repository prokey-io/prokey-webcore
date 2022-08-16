import { BaseBlockchainServer } from '../../BaseBlockchainServer';
import { BlockchainServerModel } from '../../../BlockchainProviders';
import {
    RippleAccountInfo,
    RippleAccountTransactionResponse,
    RippleFee,
    RippleTransactionDataInfo,
    RippleTransactionResponse
} from './ProkeyRippleModel';
import * as Utils from '../../../../utils/utils';

export class RippleProkeyServer extends BaseBlockchainServer {
    /**
     * Get information about an address
     * @param server Server Model
     * @param address address
     */
    public static async GetAddressInfo(server: BlockchainServerModel, address: string): Promise<RippleAccountInfo> {
        const url = `${server.url}/account/${address}`;

        return await this.GetFromServer<RippleAccountInfo>(url);
    }

    /**
     * Broadcasting the transaction
     * @param server Server Model
     * @param data Signed data to be broadcasted to network
     * @returns
     */
    public static async BroadCastTransaction(server: BlockchainServerModel, data: string): Promise<RippleTransactionResponse> {
        let data_any = data as any;
        if (data_any instanceof Uint8Array) {
            return await this.SendTransaction(server, Utils.ByteArrayToHexString(data_any).toUpperCase());
        }

        return await this.SendTransaction(server, data);
    }

    /**
     * Getting list of transaction info
     * @param server Server Model
     * @param account Account address
     * @param limit Number of transactions
     * @returns List of ripple transaction data
     */
    public static async GetAccountTransactions(server: BlockchainServerModel, account: string, limit: number = 10): Promise<Array<RippleTransactionDataInfo>> {
        let trs = await this.GetFromServer<RippleAccountTransactionResponse>(`${server.url}/account/transactions?accountAddress=${account}&pageSize${limit}`);
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

    private static async SendTransaction(server: BlockchainServerModel, data: string): Promise<RippleTransactionResponse> {
        return await this.GetFromServer<RippleTransactionResponse>(`${server.url}/transaction/submit/${data}`);
    }
}
