import React, { useEffect, useState } from "react";
import Paragraph from "antd/lib/typography/Paragraph";
import { notification } from "antd";
import Big from "big.js";
import { getWallet, createWallet } from "./createWallet";
import getBalance from "./getBalance";
import getTokenInfo from "./getTokenInfo";
import usePrevious from "./usePrevious";

const tokensCache = {};

const sortTokens = tokens => tokens.sort((a, b) => (a.tokenId > b.tokenId ? 1 : -1));

const updateTokensInfo = async (slpAddress, tokens = [], setTokens) => {
  let infos = [];

  try {
    infos = await getTokenInfo(slpAddress, tokens.map(token => token.tokenId));
  } catch (err) {
    console.log(err.message);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (!token.info) {
      try {
        const info = infos.find(i => i.tokenIdHex === token.tokenId);

        tokens[i] = {
          ...token,
          info
        };
        tokensCache[token.tokenId] = tokens[i];
        setTokens(sortTokens([...tokens]));
      } catch (err) {
        console.error(err.message);
      }
    }
  }
};

const update = async ({ wallet, tokens, setBalances, setTokens }) => {
  try {
    if (!wallet) {
      return;
    }

    const balance = await getBalance(wallet, false);
    setBalances({
      ...balance
    });

    const tokens = balance.tokens.map(token =>
      tokensCache[token.tokenId]
        ? {
            ...token,
            info: tokensCache[token.tokenId].info
          }
        : token
    );
    setTokens(sortTokens(tokens));
    await updateTokensInfo(wallet.slpAddress, tokens, setTokens);
  } catch (error) {}
};

export const useWallet = () => {
  const [wallet, setWallet] = useState(getWallet());
  const [balances, setBalances] = useState({});
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const previousBalances = usePrevious(balances);

  if (
    previousBalances &&
    balances &&
    "totalBalance" in previousBalances &&
    "totalBalance" in balances &&
    new Big(balances.totalBalance).minus(previousBalances.totalBalance).gt(0)
  ) {
    notification.success({
      message: "BCH",
      description: (
        <Paragraph>
          You received {Number(balances.totalBalance - previousBalances.totalBalance).toFixed(8)}{" "}
          BCH!
        </Paragraph>
      ),
      duration: 2
    });
  }

  useEffect(() => {
    const updateRoutine = () => {
      update({
        wallet: getWallet(),
        tokens,
        setBalances,
        setTokens,
        setLoading
      }).finally(() => {
        setLoading(false);
        setTimeout(updateRoutine, 10000);
      });
    };

    updateRoutine();
  }, []);

  return {
    wallet,
    balances,
    tokens,
    loading,
    update: () => update({ wallet, tokens, setBalances, setTokens, setLoading }),
    updateTokensInfo: () => updateTokensInfo(tokens, setTokens),
    createWallet: importMnemonic => {
      const newWallet = createWallet(importMnemonic);
      setWallet(newWallet);
      setLoading(true);
      update({ wallet: newWallet, tokens, setBalances, setTokens, setLoading }).finally(() =>
        setLoading(false)
      );
    }
  };
};
