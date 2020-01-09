import React, { useState } from "react";
import { Row, Col, Icon, Avatar, Empty, Alert } from "antd";
import { EnhancedCard } from "./EnhancedCard";
import { WalletContext } from "../../utils/context";
import { Meta } from "antd/lib/list/Item";
import Img from "react-image";
import Identicon from "./Identicon";
import Mint from "./Mint/Mint";
import Transfer from "./Transfer/Transfer";
import PayDividends from "./PayDividends/PayDividends";
import SendBCH from "./SendBCH/SendBCH";
import { PlaneIcon, HammerIcon } from "../Common/CustomIcons";
import MoreCardOptions from "./MoreCardOptions";
import PayDividendsOption from "./PayDividendsOption";
import Paragraph from "antd/lib/typography/Paragraph";
import { OnBoarding } from "../OnBoarding/OnBoarding";

export default () => {
  const ContextValue = React.useContext(WalletContext);
  const { wallet, tokens, loading, balances } = ContextValue;

  const [selectedToken, setSelectedToken] = useState(null);
  const [action, setAction] = useState(null);
  const SLP_TOKEN_ICONS_URL = "https://tokens.bch.sx/64";

  const onClose = () => {
    setSelectedToken(null);
    setAction(null);
  };

  return (
    <Row type="flex" gutter={8} style={{ position: "relative" }}>
      {!loading && wallet && (
        <Col style={{ marginTop: "8px" }} xl={7} lg={12} span={24}>
          <EnhancedCard
            style={{ marginTop: "8px", textAlign: "left" }}
            onClick={evt => {
              setAction(action !== "sendBCH" ? "sendBCH" : null);
              setSelectedToken(null);
            }}
            expand={!selectedToken && action === "sendBCH"}
            renderExpanded={() => action === "sendBCH" && <SendBCH onClose={onClose} />}
            onClose={onClose}
          >
            <Meta
              avatar={
                <Img
                  src="https://unstoppable.cash/wp-content/uploads/2018/03/12-bitcoin-cash-square-crop-small-GRN.png"
                  width="60"
                  height="60"
                />
              }
              title={
                <div
                  style={{
                    float: "right"
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "rgb(62, 63, 66)" }}>
                    BCH
                  </div>
                  <div
                    style={{
                      color: "rgb(158, 160, 165)",
                      fontSize: "12px",
                      fontWeight: "500",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Bitcoin Cash
                  </div>
                </div>
              }
              description={
                <div>
                  <div
                    style={{
                      color: "rgb(62, 63, 66)",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}
                  >
                    {balances.totalBalance ? balances.totalBalance.toFixed(8) : "0"}
                  </div>
                </div>
              }
            />
          </EnhancedCard>
        </Col>
      )}
      {loading
        ? Array.from({ length: 20 }).map((v, i) => (
            <Col style={{ marginTop: "8px" }} xl={7} lg={12} span={24}>
              <EnhancedCard loading key={i} bordered={false}>
                <Meta
                  avatar={
                    <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                  }
                  title="Token symbol"
                  description="Token description"
                />
              </EnhancedCard>
            </Col>
          ))
        : null}
      {tokens.length
        ? tokens.map(token => (
            <Col style={{ marginTop: "8px" }} xl={7} lg={12} sm={12} span={24}>
              <EnhancedCard
                loading={!token.info}
                expand={selectedToken && token.tokenId === selectedToken.tokenId}
                onClick={() =>
                  setSelectedToken(
                    !selectedToken || token.tokenId !== selectedToken.tokenId ? token : null
                  )
                }
                key={token.tokenId}
                style={{ marginTop: "8px", textAlign: "left" }}
                onClose={onClose}
                actions={[
                  <span onClick={() => setAction(action !== "transfer" ? "transfer" : null)}>
                    <PlaneIcon />
                    Send
                  </span>,
                  token.info && token.info.hasBaton && (
                    <span onClick={() => setAction(action !== "mint" ? "mint" : null)}>
                      <HammerIcon /> Mint
                    </span>
                  ),
                  <span>
                    <MoreCardOptions
                      hoverContent={
                        <PayDividendsOption
                          onClick={evt => setAction(action !== "dividends" ? "dividends" : null)}
                        />
                      }
                    >
                      <span>
                        <Icon
                          style={{ fontSize: "22px", color: "rgb(158, 160, 165)" }}
                          type="ellipsis"
                          key="ellipsis"
                        />
                      </span>
                    </MoreCardOptions>
                  </span>
                ]}
                renderExpanded={() => (
                  <>
                    {selectedToken && action === null && token.tokenId === selectedToken.tokenId ? (
                      <Alert
                        message={
                          <div>
                            <Paragraph>
                              <Icon type="info-circle" /> &nbsp; Token properties
                            </Paragraph>
                            {action ? (
                              <Paragraph
                                small
                                copyable
                                ellipsis
                                style={{ whiteSpace: "nowrap", maxWidth: "100%" }}
                              >
                                Token Id: {token.tokenId}
                              </Paragraph>
                            ) : (
                              Object.entries(token.info || {}).map(entry => (
                                <Paragraph
                                  key={token.tokenId}
                                  small
                                  copyable={{ text: entry[1] }}
                                  ellipsis
                                  style={{ whiteSpace: "nowrap", maxWidth: "100%" }}
                                >
                                  {entry[0]}: {entry[1]}
                                </Paragraph>
                              ))
                            )}
                          </div>
                        }
                        type="warning"
                        style={{ marginTop: 4 }}
                      />
                    ) : null}

                    {selectedToken && action === "mint" ? (
                      <Mint token={selectedToken} onClose={onClose} />
                    ) : null}
                    {selectedToken && action === "transfer" ? (
                      <Transfer token={selectedToken} onClose={onClose} />
                    ) : null}
                    {selectedToken && action === "dividends" ? (
                      <PayDividends token={selectedToken} onClose={onClose} />
                    ) : null}
                  </>
                )}
              >
                <Meta
                  avatar={
                    <Img
                      src={`${SLP_TOKEN_ICONS_URL}/${token.tokenId}.png`}
                      unloader={
                        <Identicon
                          key={token.tokenId}
                          style={{ tranform: "translate(-100px,100px)" }}
                          seed={token.tokenId}
                        />
                      }
                    />
                  }
                  title={
                    <div
                      style={{
                        float: "right"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "rgb(62, 63, 66)"
                        }}
                      >
                        {token.info && token.info.symbol.toUpperCase()}
                      </div>
                      <div
                        style={{
                          color: "rgb(158, 160, 165)",
                          fontSize: "12px",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "210px"
                        }}
                      >
                        {token.info && token.info.name}
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <div
                        style={{
                          color: "rgb(62, 63, 66)",
                          fontSize: "16px",
                          fontWeight: "bold"
                        }}
                      >
                        {token.balance.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")}
                      </div>
                    </div>
                  }
                />
              </EnhancedCard>
            </Col>
          ))
        : null}
      <Col span={24} style={{ marginTop: "8px" }}>
        {!loading && !tokens.length && wallet ? <Empty description="No tokens found" /> : null}
        {!loading && !tokens.length && !wallet ? <OnBoarding /> : null}
      </Col>
    </Row>
  );
};
