export interface RippleAccount
{
    Account: string,
    AccountTxnID?: string,
    Balance?: string,
    Domain?: null,
    EmailHash?: null,
    MessageKey?: null,
    RegularKey?: null,
    OwnerCount: number,
    PreviousTxnID: string,
    PreviousTxnLgrSeq: number,
    Sequence: number,
    TickSize: number,
    TransferRate: number,
    LedgerEntryType: string,
    Flags: number,
    index: string
}