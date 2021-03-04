<template>
  <div class="details">
    <div class="search">
      <VueInput v-model="symbolName" class="vue-ui-dark-mode" @change="search" placeholder="Search symbol" />
    </div>

    <div id="header" class="col5">
      <span>Symbol</span>
      <span>Rename</span>
      <span>Price</span>
      <span>Low Alarm</span>
      <span>High Alarm</span>
    </div>
    <div class="list">
      <div v-for="item in symbols" :key="item.symbol">
        <div class="col5">
          <VueSwitch class="extend-left" v-model="item.show">{{ item.symbol }}</VueSwitch>
          <VueInput v-model="item.rename" placeholder="rename" />
          <span>{{ item.price }}</span>
          <VueInput v-model="item.low" placeholder="Low" />
          <VueInput v-model="item.high" placeholder="High" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

export default {
  name: 'Details',
  props: {},
  data: function() {
    return { symbolMap: {}, symbols: [], symbolFilter: [], symbolName: '' };
  },
  mounted: function() {
    ipcRenderer.send('getSettings');
    ipcRenderer.on('getSettings', (event, arg) => {
      if (arg) {
        this.getSetting(arg);
      }
    });
  },
  methods: {
    getSetting: function(settings) {
      const symbols = settings.symbols;
      const symbolFilter = settings.symbolFilter;
      const showSymbols = [];
      const sObj = {};
      for (const s of symbols) {
        sObj[s.symbol] = {
          symbol: s.symbol,
          price: s.price,
          show: false,
          rename: s.symbol,
          low: 0,
          high: 100000000
        };
      }
      for (const sf in symbolFilter) {
        if (sObj[sf]) {
          sObj[sf].show = true;
          sObj[sf].rename = symbolFilter[sf].rename;
          sObj[sf].low = symbolFilter[sf].low;
          sObj[sf].high = symbolFilter[sf].high;

          showSymbols.push(sObj[sf]);
        }
      }

      this.symbolMap = sObj;
      this.symbols = showSymbols;
      this.symbolFilter = symbolFilter;
    },
    search: function() {
      const showSymbols = [];
      for (const s in this.symbolMap) {
        if (this.symbolName) {
          if (s.toLowerCase().indexOf(this.symbolName.toLowerCase()) > -1) {
            showSymbols.push(this.symbolMap[s]);
          }
        } else {
          if (this.symbolMap[s].show) {
            showSymbols.push(this.symbolMap[s]);
          }
        }
      }
      this.symbols = showSymbols;
    }
  },
  watch: {
    symbols: {
      handler: function(val) {
        if (val.length == 0) return;
        const allSymbols = Object.values(this.symbolMap);
        const showSymbol = allSymbols.filter(_ => _.show);
        const sObj = {};
        for (const sf of showSymbol) {
          sObj[sf.symbol] = {};
          sObj[sf.symbol].rename = sf.rename;
          sObj[sf.symbol].low = sf.low;
          sObj[sf.symbol].high = sf.high;
        }

        ipcRenderer.send('updateSettings', sObj);
      },
      deep: true
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.search {
  margin-bottom: 20px;
  text-align: center;
}
.details {
  text-align: left;
  margin: 0 12px;
  .list {
    overflow: scroll;
    .vue-ui-input {
      min-width: 50px;
    }
  }
  .col5 {
    margin-bottom: 12px;
    display: grid;
    grid-gap: 12px;
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
