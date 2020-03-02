export default class Dividends {
  static BATCH_SIZE = 2500;

  static Status = {
    IN_PROGRESS: 0,
    PAUSED: 1,
    CANCELED: 2,
    CRASHED: 3
  };

  constructor({ token, recipients, totalValue, values, opReturn }) {
    this.progress = 0;
    this.status = Dividends.Status.IN_PROGRESS;
    this.token = token;
    this.startDate = Date.now();
    this.endDate = null;
    this.txs = [];
    this.totalRecipients = recipients.length;
    this.remainingRecipients = recipients;
    this.remainingValues = values;
    this.opReturn = opReturn;
    this.totalValue = totalValue;
    this.error = "";
  }

  static getAll = () =>
    window.localStorage.getItem("dividends")
      ? JSON.parse(window.localStorage.getItem("dividends"))
      : {};

  static save = dividend => {
    try {
      const storedDividends = Dividends.getAll();
      window.localStorage.setItem(
        "dividends",
        JSON.stringify({
          ...storedDividends,
          [dividend.startDate]: {
            ...storedDividends[dividend.startDate],
            ...dividend
          }
        })
      );
    } catch (error) {
      console.log("Unable to save setDividends due to: ", error.message);
    }
  };
}
