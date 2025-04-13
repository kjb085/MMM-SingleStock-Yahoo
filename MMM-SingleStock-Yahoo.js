/* global Module, Log */

/* Magic Mirror Module: MMM-SingleStock-Yahoo (https://github.com/kjb085/MMM-SingleStock-Yahoo)
 * MIT Licensed.
 */

Module.register("MMM-SingleStock-Yahoo", {
  defaults: {
    stockSymbol: "GOOG",
    updateInterval: 3600000,
    showChange: true,
    changeType: "",
    colorized: false,
    minimal: false,
    label: "symbol", // 'symbol' | 'companyName' | 'none'
  },

  requiresVersion: "2.1.0",

  getTranslations() {
    return {
      en: "translations/en.json",
      hu: "translations/hu.json",
    };
  },

  start() {
    this.viewModel = null;
    this.hasData = false;

    // this._getData(() => self.updateDom());

    // setInterval(() => {
    //   self._getData(() => self.updateDom());
    // }, this.config.updateInterval);
    this.initializeUpdate();
    this.setUpdateInterval();
  },

  initializeUpdate() {
    this.sendSocketNotification("SINGLE_STOCK_CONFIG", {
      config: this.config,
    });
  },

  setUpdateInterval() {
    this.updater = setInterval(() => {
      this.initializeUpdate();
    }, this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (this.viewModel) {
      const priceEl = document.createElement("div");
      if (this.config.minimal) {
        priceEl.classList = "small";
      }

      const labelEl = document.createElement("span");
      labelEl.innerHTML = `${this.viewModel.label}`;
      priceEl.appendChild(labelEl);

      const valueEl = document.createElement("span");
      valueEl.innerHTML = ` ${this.viewModel.price}`;
      if (this.config.colorized) {
        valueEl.classList = "bright";
      }
      priceEl.appendChild(valueEl);

      wrapper.appendChild(priceEl);

      if (this.config.showChange) {
        const changeEl = document.createElement("div");

        changeEl.innerHTML =
          this.config.changeType === "percent"
            ? `(${this.viewModel.change}%)`
            : `(${this.viewModel.change})`;

        changeEl.classList = this.config.minimal
          ? "dimmed xsmall"
          : "dimmed small";

        if (this.config.colorized) {
          if (this.viewModel.change > 0) {
            changeEl.style = "color: #a3ea80";
          }
          if (this.viewModel.change < 0) {
            changeEl.style = "color: #FF8E99";
          }
        }

        wrapper.appendChild(changeEl);
      }
    } else {
      const loadingEl = document.createElement("span");
      loadingEl.innerHTML = this.translate("LOADING", {
        symbol: this.config.stockSymbol,
      });
      loadingEl.classList = "dimmed small";
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  // _getData(onCompleteCallback) {
  //   const self = this;

  //   const url = `https://query2.finance.yahoo.com/v8/finance/chart/${this.config.stockSymbol}`;

  //   const xhr = new XMLHttpRequest();
  //   xhr.open("GET", url, true);
  //   xhr.onreadystatechange = function onReadyStateChange() {
  //     if (this.readyState === 4) {
  //       if (this.status === 200) {
  //         self._processResponse(this.response);
  //         onCompleteCallback();
  //       } else {
  //         Log.error(
  //           self.name,
  //           `MMM-SingleStock-Yahoo: Failed to load data. XHR status: ${this.status}`
  //         );
  //       }
  //     }
  //   };

  //   xhr.send();
  // },

  socketNotificationReceived(notification, payload) {
    // This is needed so that initializeRefreshDom doesn't wait
    // for the existing rotator to invoke it
    let isRotatingPosts = this.rotator !== null,
      shouldUpdateImmediately =
        !isRotatingPosts || this.config.forceImmediateUpdate;

    if (notification === "SINGLE_STOCK_DATA") {
      if (this.config.stockSymbol == payload.symbol) {
        this._processResponse(payload);
      }
    } else if (notification === "SINGLE_STOCK_ERROR") {
      console.log("MMM-SingleStock-Yahoo", payload);
    }

    // this.initializeRefreshDom(shouldUpdateImmediately);
  },

  _processResponse(initialViewModel) {
    // const response = JSON.parse(responseBody);
    // const result = response.chart.results[0].meta;
    // const price = result.regularMarketPrice;
    // const prevClose = result.chartPreviousClose;
    // const change = price - prevClose;

    this.viewModel = initialViewModel;

    switch (this.config.changeType) {
      case "percent":
        this.viewModel.change = ((change / price) * 100).toFixed(2);
        break;
      default:
        this.viewModel.change =
          this.viewModel.change > 0
            ? `+${this.viewModel.change}`
            : `${this.viewModel.change}`;
        break;
    }

    switch (this.config.label) {
      case "symbol":
        this.viewModel.label = this.viewModel.symbol;
        break;
      case "companyName":
        this.viewModel.label = this.viewModel.shortName;
        break;
      case "none":
        this.viewModel.label = "";
        break;
      default:
        this.viewModel.label = this.config.label;
        break;
    }

    if (!this.hasData) {
      this.hasData = true;
    }

    this.updateDom();
  },
});
