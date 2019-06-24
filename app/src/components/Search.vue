<template>
  <div id="search" class="search vue-ui-dark-mode">
    <VueInput v-model="symbol" class="vue-ui-dark-mode" @change="search" placeholder="Search symbol"/>
    <VueButton class="icon-button vue-ui-dark-mode" :disabled="!symbol" @click="findForward" icon-left="navigate_before"/>
    <VueButton class="icon-button vue-ui-dark-mode" :disabled="!symbol" @click="findNext" icon-left="navigate_next"/>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

export default {
  name: 'Search',
  props: {},
  data: function() {
    return { symbol: '' };
  },
  mounted: function() {},
  methods: {
    search: function() {
      ipcRenderer.send('searchSymbol', this.symbol);
    },
    findForward: function() {
      ipcRenderer.send('searchSymbol', this.symbol, {
        forward: false,
        findNext: true
      });
    },
    findNext: function() {
      ipcRenderer.send('searchSymbol', this.symbol, {
        forward: true,
        findNext: true
      });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.search {
  text-align: left;
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 30px + 12px * 2;
  z-index: 100;
  .vue-ui-input {
    margin: 12px 0 12px 12px;
  }
  .vue-ui-button {
    margin: 12px 0 12px 12px;
  }
}
</style>
