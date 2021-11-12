import React from 'react';
import styled from './Wallet.module.css';
import withdrawIcon from '../../assets/withdraw_yellow_bg.png';
import depositIcon from '../../assets/deposit_green_bg.png';
import { UserContext } from '../../UserContext';
import db from '../../services/Db';
import { GET_CRYPTOS_PRICE_ONLY } from '../../services/Api';

const Wallet = () => {
  const global = React.useContext(UserContext);
  const [showDeposit, setShowDeposit] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [trades, setTrades] = React.useState(null);

  function formatNumber(number) {
    if (number >= 1e6) {
      return number.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
    } else if (number >= 1) {
      return number.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    } else {
      return number.toLocaleString('pt-BR', { minimumFractionDigits: 6 });
    }
  }

  async function getAllTrades(id) {
    const trades = await db
      .get(`broker/trades/${id}`)
      .then((response) => response.data);
    return trades;
  }

  async function calculateProfits(trades) {
    function filterByCoin(trades) {
      let result = trades.reduce((filtered, trade) => {
        if (Object.keys(filtered).includes(trade.crypto_name)) {
          filtered[trade.crypto_id] = {
            name: trade.crypto_name,
            amount: filtered[trade.crypto_name]['amount'] + trade.quantity,
            totalSpent:
              filtered[trade.crypto_name]['totalSpent'] +
              trade.quantity * trade.unit_price,
          };
        } else {
          filtered[trade.crypto_id] = {
            name: trade.crypto_name,
            amount: trade.quantity,
            totalSpent: trade.quantity * trade.unit_price,
          };
        }
        return filtered;
      }, {});
      console.log(result);
      return result;
    }

    let wallet = filterByCoin(trades);

    const currentPrices = await GET_CRYPTOS_PRICE_ONLY(Object.keys(wallet));

    if (currentPrices) {
      console.log(currentPrices);
      for (var coin in wallet) {
        console.log(coin);
        wallet[coin]['currentPrice'] = currentPrices[coin]['usd'];
        wallet[coin]['profit'] =
          wallet[coin]['amount'] * wallet[coin]['currentPrice'] -
          wallet[coin]['totalSpent'];
      }
      console.log('final :', wallet);
      return wallet;
    }
  }

  function getTotalAmount() {
    let totalAmount = 0;
    for (var coin in trades) {
      totalAmount += trades[coin].amount;
    }
    return totalAmount;
  }

  function getTotalSpent() {
    let totalSpent = 0;
    for (var coin in trades) {
      totalSpent += trades[coin].totalSpent;
    }
    return totalSpent;
  }
  function getTotalProfits() {
    let totalProfit = 0;

    for (var coin in trades) {
      totalProfit += trades[coin].profit;
    }

    return totalProfit;
  }

  React.useEffect(() => {
    async function buildWallet() {
      await global.autoLogin();
      if (global.login) {
        const allTrades = await getAllTrades(global.data.id);
        const filteredTrades = await calculateProfits(allTrades);
        if (filteredTrades) {
          console.log(filteredTrades);
          setTrades(filteredTrades);
        }
      } else {
        alert('Você precisa estar logado para acessar a carteira!');
        global.navigate('/login');
      }
    }

    buildWallet();
  }, [global.login]);

  async function tradeMoneyToAccount(user_id, amount) {
    const edited_user = await db
      .post(`trade_to_account/17/`, { amount: 1000 })
      .then((response) => response.data);

    if (edited_user) {
      global.setData(edited_user);
    }
  }
  return (
    <div className={styled.container}>
      <div className={styled.header}>
        <h1 className={styled.investor}>Guilherme</h1>
        <div className={styled.resume}>
          <p className={styled.currentMoney}>
            $ {formatNumber(global.data.current_money)}
          </p>
          <div className={styled.transactions}>
            <div className={styled.operation}>
              <img
                src={depositIcon}
                className={styled.icon}
                alt={'Depositar dinheiro'}
                onMouseEnter={() => setShowDeposit(true)}
                onMouseLeave={() => setShowDeposit(false)}
                onClick={tradeMoneyToAccount}
              />
              {showDeposit ? (
                <p className={styled.subtitle}>Depositar</p>
              ) : null}
            </div>
            <div className={styled.operation}>
              <img
                src={withdrawIcon}
                className={styled.icon}
                alt={'Retirar dinheiro'}
                onMouseEnter={() => setShowWithdraw(true)}
                onMouseLeave={() => setShowWithdraw(false)}
                onClick={tradeMoneyToAccount}
              />
              {showWithdraw ? <p className={styled.subtitle}>Retirar</p> : null}
            </div>
          </div>
        </div>
      </div>
      <div className={styled.tableBox}>
        {trades ? (
          <table className={styled.table}>
            <thead>
              <tr>
                <td>Nome</td>
                <td>qtd</td>
                <td>Preço Atual ($)</td>
                <td>Preço Médio ($)</td>
                <td>Lucro ($)</td>
              </tr>
            </thead>
            <tbody>
              {Object.keys(trades).map((coin) => (
                <tr key={coin}>
                  <td>{trades[coin].name}</td>
                  <td>{formatNumber(trades[coin].amount)}</td>
                  <td className={styled.precoAtual}>{`${formatNumber(
                    trades[coin].currentPrice,
                  )}`}</td>
                  <td className={styled.precoMedio}>{`${formatNumber(
                    trades[coin].totalSpent / trades[coin].amount,
                  )}`}</td>
                  <td
                    className={
                      trades[coin].profit >= 0 ? styled.profit : styled.loss
                    }
                  >{`${formatNumber(trades[coin].profit)}`}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total:</td>
                <td>{formatNumber(getTotalAmount())}</td>
                <td></td>
                <td>{formatNumber(getTotalSpent())}</td>
                <td
                  className={
                    getTotalProfits() >= 0 ? styled.profit : styled.loss
                  }
                >
                  {formatNumber(getTotalProfits())}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : null}
      </div>
    </div>
  );
};

export default Wallet;
