import {
  NEMSignTxMessage,
  NEMTransactionCommon,
  NEMTransfer,
  NEMImportanceTransfer,
  NEMAggregateModification,
  NEMProvisionNamespace,
  NEMMosaicCreation,
  NEMMosaicDefinition,
  NEMMosaicSupplyChange
} from "../../models/Prokey";
import {
  NEMAggregateModificationTransaction,
  NEMImportanceTransaction, NEMMosaicCreationTransaction, NEMProvisionNamespaceTransaction, NEMSupplyChangeTransaction,
  NEMTransaction,
  NEMTransferTransaction
} from "../../wallet/nem/NemWalletModels";

export const NEM_MAINNET = 0x68;
export const NEM_TESTNET = 0x98;
export const NEM_MIJIN = 0x60;

export const NETWORKS = {
  mainnet: NEM_MAINNET,
  testnet: NEM_TESTNET,
  mijin: NEM_MIJIN,
};

export const NEM_TRANSFER: 0x0101 = 0x0101;
export const NEM_COSIGNING: 0x0102 = 0x0102;
export const NEM_IMPORTANCE_TRANSFER: 0x0801 = 0x0801;
export const NEM_AGGREGATE_MODIFICATION: 0x1001 = 0x1001;
export const NEM_MULTISIG_SIGNATURE: 0x1002 = 0x1002;
export const NEM_MULTISIG: 0x1004 = 0x1004;
export const NEM_PROVISION_NAMESPACE: 0x2001 = 0x2001;
export const NEM_MOSAIC_CREATION: 0x4001 = 0x4001;
export const NEM_SUPPLY_CHANGE: 0x4002 = 0x4002;

const NEM_MOSAIC_LEVY_TYPES = {
  '1': 'MosaicLevy_Absolute',
  '2': 'MosaicLevy_Percentile',
};

const NEM_SUPPLY_CHANGE_TYPES = {
  '1': 'SupplyChange_Increase',
  '2': 'SupplyChange_Decrease',
};

const NEM_AGGREGATE_MODIFICATION_TYPES = {
  '1': 'CosignatoryModification_Add',
  '2': 'CosignatoryModification_Delete',
};

const NEM_IMPORTANCE_TRANSFER_MODES = {
  '1': 'ImportanceTransfer_Activate',
  '2': 'ImportanceTransfer_Deactivate',
};

const getCommon = (tx: NEMTransaction, address_n: number[]): NEMTransactionCommon => ({
  address_n,
  network: (tx.version >> 24) & 0xff,
  timestamp: tx.timeStamp,
  fee: tx.fee,
  deadline: tx.deadline,
  signer: address_n ? undefined : tx.signer,
});

const transferMessage = (tx: NEMTransferTransaction): NEMTransfer => {
  const mosaics = tx.mosaics
    ? tx.mosaics.map(mosaic => ({
      namespace: mosaic.mosaicId.namespaceId,
      mosaic: mosaic.mosaicId.name,
      quantity: mosaic.quantity,
    }))
    : undefined;

  return {
    recipient: tx.recipient,
    amount: tx.amount,
    payload: tx.message ? tx.message.payload : undefined,
    public_key: tx.message && tx.message.type === 0x02 ? tx.message.publicKey : undefined,
    mosaics,
  };
};

const importanceTransferMessage = (tx: NEMImportanceTransaction): NEMImportanceTransfer => ({
  mode: NEM_IMPORTANCE_TRANSFER_MODES[tx.importanceTransfer.mode],
  public_key: tx.importanceTransfer.publicKey,
});

const aggregateModificationMessage = (
  tx: NEMAggregateModificationTransaction,
): NEMAggregateModification => {
  const modifications = tx.modifications
    ? tx.modifications.map(modification => ({
      type: NEM_AGGREGATE_MODIFICATION_TYPES[modification.modificationType],
      public_key: modification.cosignatoryAccount,
    }))
    : undefined;

  return {
    modifications,
    relative_change: tx.minCosignatories.relativeChange,
  };
};

const provisionNamespaceMessage = (
  tx: NEMProvisionNamespaceTransaction,
): NEMProvisionNamespace => ({
  namespace: tx.newPart,
  parent: tx.parent || undefined,
  sink: tx.rentalFeeSink,
  fee: tx.rentalFee,
});

const mosaicCreationMessage = (tx: NEMMosaicCreationTransaction): NEMMosaicCreation => {
  const { levy } = tx.mosaicDefinition;

  const definition: NEMMosaicDefinition = {
    namespace: tx.mosaicDefinition.id.namespaceId,
    mosaic: tx.mosaicDefinition.id.name,
    levy: levy && levy.type ? NEM_MOSAIC_LEVY_TYPES[levy.type] : undefined,
    fee: levy && levy.fee,
    levy_address: levy && levy.recipient,
    levy_namespace: levy && levy.mosaicId && levy.mosaicId.namespaceId,
    levy_mosaic: levy && levy.mosaicId && levy.mosaicId.name,
    description: tx.mosaicDefinition.description,
  };

  const { properties } = tx.mosaicDefinition;
  if (Array.isArray(properties)) {
    properties.forEach(property => {
      const { name, value } = property;
      switch (name) {
        case 'divisibility':
          definition.divisibility = parseInt(value, 10);
          break;

        case 'initialSupply':
          definition.supply = parseInt(value, 10);
          break;

        case 'supplyMutable':
          definition.mutable_supply = value === 'true';
          break;

        case 'transferable':
          definition.transferable = value === 'true';
          break;

        // no default
      }
    });
  }

  return {
    definition,
    sink: tx.creationFeeSink,
    fee: tx.creationFee,
  };
};

const supplyChangeMessage = (tx: NEMSupplyChangeTransaction): NEMMosaicSupplyChange => ({
  namespace: tx.mosaicId.namespaceId,
  mosaic: tx.mosaicId.name,
  type: NEM_SUPPLY_CHANGE_TYPES[tx.supplyType],
  delta: tx.delta,
});

export const createTx = (tx: NEMTransaction, address_n: number[]) => {
  let transaction = tx;
  const message: NEMSignTxMessage = {
    transaction: getCommon(tx, address_n),
    transfer: undefined,
    importance_transfer: undefined,
    aggregate_modification: undefined,
    provision_namespace: undefined,
    mosaic_creation: undefined,
    supply_change: undefined,
  };

  if (
    tx.type === NEM_COSIGNING ||
    tx.type === NEM_MULTISIG ||
    tx.type === NEM_MULTISIG_SIGNATURE
  ) {
    message.cosigning = tx.type === NEM_COSIGNING || tx.type === NEM_MULTISIG_SIGNATURE;
    transaction = tx.otherTrans;
    message.multisig = getCommon(transaction, address_n);
  }

  switch (transaction.type) {
    case NEM_TRANSFER:
      message.transfer = transferMessage(transaction);
      break;

    case NEM_IMPORTANCE_TRANSFER:
      message.importance_transfer = importanceTransferMessage(transaction);
      break;

    case NEM_AGGREGATE_MODIFICATION:
      message.aggregate_modification = aggregateModificationMessage(transaction);
      break;

    case NEM_PROVISION_NAMESPACE:
      message.provision_namespace = provisionNamespaceMessage(transaction);
      break;

    case NEM_MOSAIC_CREATION:
      message.mosaic_creation = mosaicCreationMessage(transaction);
      break;

    case NEM_SUPPLY_CHANGE:
      message.supply_change = supplyChangeMessage(transaction);
      break;

    default:
      throw new Error('Unknown transaction type');
  }

  return message;
};
