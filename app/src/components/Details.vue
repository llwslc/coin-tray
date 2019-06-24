<template>
  <div class="details">
    <div class="col5">
      <span>Symbol</span>
      <span>Rename</span>
      <span>Price</span>
      <span>Low Alarm</span>
      <span>High Alarm</span>
    </div>
    <div v-for="(item, index) in symbols" :key="index">
      <div class="col5">
        <VueSwitch class="extend-left" v-model="item.show">{{ item.symbol }}</VueSwitch>
        <VueInput v-model="item.rename" placeholder="rename"/>
        <span>{{ item.price }}</span>
        <VueInput v-model="item.low" placeholder="Low"/>
        <VueInput v-model="item.high" placeholder="High"/>
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
    return { symbols: [] };
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
      let symbols = settings.symbols;
      let symbolFilter = settings.symbolFilter;
      let sObj = {};
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
        }
      }

      this.symbols = Object.values(sObj);
    }
  },
  watch: {
    symbols: {
      handler: function(val) {
        let showSymbol = val.filter(_ => _.show);
        let sObj = {};
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
.details {
  text-align: left;
  margin: 0 12px;

  .col5 {
    margin-bottom: 12px;
    display: grid;
    grid-gap: 12px;
    grid-template-columns: repeat(5, 1fr);
  }
  .vue-ui-input {
    min-width: 50px;
  }
}
</style>
