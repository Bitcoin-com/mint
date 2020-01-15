import Big from "big.js";
import withSLP from "./withSLP";

export const SATOSHIS_PER_BYTE = 1.01;
const NETWORK = process.env.REACT_APP_NETWORK;

export const sendBch = withSLP(async (SLP, wallet, utxos, { addresses, values }) => {
  try {
    if (!values.length) {
      return null;
    }

    const value = values.reduce((previous, current) => new Big(current).plus(previous), new Big(0));
    const REMAINDER_ADDR = wallet.cashAddress;

    const inputUtxos = [];
    let transactionBuilder;

    // instance of transaction builder
    if (NETWORK === `mainnet`) transactionBuilder = new SLP.TransactionBuilder();
    else transactionBuilder = new SLP.TransactionBuilder("testnet");

    const satoshisToSend = SLP.BitcoinCash.toSatoshi(value.toPrecision(8));
    let originalAmount = new Big(0);
    let txFee = 0;
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      originalAmount = originalAmount.plus(utxo.satoshis);
      const vout = utxo.vout;
      const txid = utxo.txid;
      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout);
      inputUtxos.push(utxo);

      const byteCount = SLP.BitcoinCash.getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: addresses.length + 1 }
      );
      const satoshisPerByte = SATOSHIS_PER_BYTE;
      txFee = Math.floor(satoshisPerByte * byteCount);

      if (
        originalAmount
          .minus(satoshisToSend)
          .minus(txFee)
          .gte(0)
      ) {
        break;
      }
    }

    // amount to send back to the remainder address.
    const remainder = Math.floor(originalAmount.minus(satoshisToSend).minus(txFee));

    if (remainder < 0) {
      throw new Error(`Insufficient funds`);
    }

    // add output w/ address and amount to send
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      transactionBuilder.addOutput(address, SLP.BitcoinCash.toSatoshi(values[i]));
    }

    if (remainder) {
      transactionBuilder.addOutput(REMAINDER_ADDR, remainder);
    }

    // Sign the transactions with the HD node.
    for (let i = 0; i < inputUtxos.length; i++) {
      const utxo = inputUtxos[i];
      transactionBuilder.sign(
        i,
        SLP.ECPair.fromWIF(utxo.wif),
        undefined,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        utxo.satoshis
      );
    }

    // build tx
    const tx = transactionBuilder.build();
    // output rawhex
    const hex = tx.toHex();

    // Broadcast transation to the network
    const txidStr = await SLP.RawTransactions.sendRawTransaction([hex]);
    let link;
    if (NETWORK === `mainnet`) {
      link = `https://explorer.bitcoin.com/bch/tx/${txidStr}`;
    } else {
      link = `https://explorer.bitcoin.com/tbch/tx/${txidStr}`;
    }
    console.log(link);

    return link;
  } catch (err) {
    console.log(`error: `, err);
    throw err;
  }
});

export const getBCHUtxos = withSLP(async (SLP, cashAddress) => {
  const u = await SLP.Address.utxo(cashAddress);
  const isTokenUtxoArray = await SLP.Utils.isTokenUtxo(u.utxos);
  return u.utxos.filter((utxo, index) => !isTokenUtxoArray[index]);
});

// Get the balance in BCH of a BCH address.
export const getBalanceFromUtxos = withSLP((SLP, utxos) => {
  let satoshis = new Big(0);
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    satoshis = satoshis.plus(utxo.satoshis);
  }
  return SLP.BitcoinCash.toBitcoinCash(Math.floor(satoshis));
});

export const calcFee = withSLP((SLP, utxos) => {
  const byteCount = SLP.BitcoinCash.getByteCount({ P2PKH: utxos.length }, { P2PKH: 2 });
  const satoshisPerByte = SATOSHIS_PER_BYTE;
  const txFee = SLP.BitcoinCash.toBitcoinCash(Math.floor(satoshisPerByte * byteCount));
  return txFee;
});
