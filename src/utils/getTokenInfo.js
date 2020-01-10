import withSLP from "./withSLP";

const getTokenInfo = async (SLP, slpAddress, tokenIds) => {
  try {
    const query = {
      q: {
        find: {
          "tokenDetails.tokenIdHex": {
            $in: tokenIds
          },
          "tokenDetails.transactionType": "GENESIS"
        },
        limit: 1000
      },
      v: 3
    };
    const slpDbInstance = SLP.SLPDB;
    const queryResults = await slpDbInstance.get(query);
    const queryResultsForGenesisTransaction = await SLP.Transaction.details(
      queryResults.t.filter(t => t.mintBatonUtxo).map(t => t.mintBatonUtxo.replace(":2", ""))
    );
    return tokenIds.map((r, i) => {
      const queryResult = queryResults.t[i];
      const genesisTransactionDetails = queryResult.mintBatonUtxo
        ? queryResultsForGenesisTransaction.find(
            tx => tx.txid === queryResult.mintBatonUtxo.replace(":2", "")
          )
        : null;
      return {
        ...queryResult.tokenDetails,
        hasBaton:
          genesisTransactionDetails &&
          genesisTransactionDetails.vin &&
          SLP.Address.toSLPAddress(genesisTransactionDetails.vin[0].cashAddress) === slpAddress
      };
    });
  } catch (e) {
    return [];
  }
};

export default withSLP(getTokenInfo);
