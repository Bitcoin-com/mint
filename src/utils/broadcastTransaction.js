import getWalletDetails from "./getWalletDetails";
import withSLP from "./withSLP";

const broadcastTransaction = async (SLPInstance, wallet, slpBalancesAndUtxo, { ...args }) => {
  try {
    const NETWORK = process.env.REACT_APP_NETWORK;

    const TRANSACTION_TYPE =
      (args.additionalTokenQty && args.tokenId && "IS_MINTING") ||
      (args.initialTokenQty && args.symbol && args.name && "IS_CREATING") ||
      (args.amount && args.tokenId && args.tokenReceiverAddress && "IS_SENDING");

    const { Bip44 } = getWalletDetails(wallet);

    const FundingAccount = slpBalancesAndUtxo[0].account; // account with the highest balance

    const config = args;
    config.bchChangeReceiverAddress = Bip44.cashAddress;
    config.fundingWif = FundingAccount.fundingWif;
    config.fundingAddress = FundingAccount.fundingAddress;

    let createTransaction;

    switch (TRANSACTION_TYPE) {
      case "IS_CREATING":
        config.batonReceiverAddress = Bip44.slpAddress;
        config.decimals = config.decimals || 0;
        config.documentUri = config.docUri;
        config.tokenReceiverAddress = Bip44.slpAddress;
        createTransaction = async config => SLPInstance.TokenType1.create(config);
        break;
      case "IS_MINTING":
        config.batonReceiverAddress = config.batonReceiverAddress || Bip44.slpAddress;
        config.tokenReceiverAddress = Bip44.slpAddress;
        createTransaction = async config => SLPInstance.TokenType1.mint(config);
        break;
      case "IS_SENDING":
        config.tokenReceiverAddress = args.tokenReceiverAddress;
        createTransaction = async config => SLPInstance.TokenType1.send(config);
        break;
      default:
        break;
    }
    const broadcastedTransaction = await createTransaction(config);

    let link;
    if (NETWORK === `mainnet`) {
      link = `https://explorer.bitcoin.com/bch/tx/${broadcastedTransaction}`;
    } else {
      link = `https://explorer.bitcoin.com/tbch/tx/${broadcastedTransaction}`;
    }

    return link;
  } catch (err) {
    console.error(`Error in createToken: `, err);
    console.log(`Error message: ${err.message}`);
    throw err;
  }
};

export default withSLP(broadcastTransaction);
