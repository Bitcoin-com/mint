import React, { useEffect, useState, useRef } from "react";
import { getWallet, createWallet } from "./createWallet";
import getBalance from "./getBalance";
import getTokenInfo from "./getTokenInfo";
import Paragraph from "antd/lib/typography/Paragraph";
import { notification } from "antd";

const tokensCache = {};

const usePrevious = value => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
};

const sortTokens = tokens => tokens;

const updateTokensInfo = async (slpAddress, tokens = [], setTokens) => {
  let infos = [];

  try {
    infos = await getTokenInfo(slpAddress, tokens.map(token => token.tokenId));
    infos.forEach(info => {
      let index = tokens.findIndex(token => token.tokenId === info.tokenIdHex);
      if (index !== -1) {
        tokens[index] = {
          ...tokens[index],
          info
        };
        tokensCache[tokens[index].tokenId] = tokens[index];
        setTokens(sortTokens([...tokens]));
      }
    });
  } catch (err) {}
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

  if (previousBalances && balances && previousBalances.totalBalance < balances.totalBalance) {
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
