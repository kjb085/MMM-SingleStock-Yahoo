/* Magic Mirror
 * Module: MMM-Reddit
 *
 * By kjb085 https://github.com/kjb085/MMM-Reddit
 */
const request = require("request");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  url: "https://query2.finance.yahoo.com/v8/finance/chart/",

  start() {
    console.log(`Starting module helper: ${this.name}`);
  },

  socketNotificationReceived(notification, payload) {
    console.log("Received", { notification, payload });
    if (notification === "SINGLE_STOCK_CONFIG") {
      this.config = payload.config;
      this.getData();
    }
  },

  sendData(obj) {
    this.sendSocketNotification("SINGLE_STOCK_DATA", obj);
  },

  sendError(error) {
    console.log(error);
    this.sendSocketNotification("SINGLE_STOCK_ERROR", { message: error });
  },

  getData() {
    const url = this.url + this.config.stockSymbol;

    request(
      {
        url: url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0",
        },
      },
      (_error, response, body) => {
        if (response.statusCode === 200) {
          const jsonBody = JSON.parse(body);
          if (
            typeof jsonBody.chart !== "undefined" ||
            typeof jsonBody.chart.result !== "undefined" ||
            typeof jsonBody.chart.result[0] !== "undefined" ||
            typeof jsonBody.chart.result[0].meta !== "undefined"
          ) {
            const result = jsonBody.chart.result[0].meta;

            this.sendData({
              price: result.regularMarketPrice,
              prevClose: result.chartPreviousClose,
              change: result.regularMarketPrice - result.chartPreviousClose,
            });
          } else {
            this.sendError("Unexpected response");
          }
        } else {
          this.sendError("Request status code: " + response.statusCode);
        }
      }
    );
  },
});
