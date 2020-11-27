<template>
  <div class="about">
    <h1>This is an about page</h1>
    <canvas id="canvas" width="60" height="22">Your browser does not support the HTML5 canvas tag.</canvas>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

export default {
  name: 'About',
  mounted: function() {
    ipcRenderer.on('genImg', (event, prices) => {
      if (prices.length) {
        generateInfoImg(prices.reverse());
      }
    });

    const canvas = document.getElementById('canvas');
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');

    function generateInfoImg(prices) {
      let width = 0;
      const height = 22;

      ctx.font = '10px';

      const space = ctx.measureText('  ').width;
      for (const p of prices) {
        const sWidth = ctx.measureText(`${p.rename}  `).width;
        const pWidth = ctx.measureText(`${p.price}  `).width;
        const mWidth = sWidth > pWidth ? sWidth : pWidth;

        p.width = mWidth - space;
        p.offset = width;
        width += mWidth;
      }
      width -= space;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      for (const p of prices) {
        p.warning ? (ctx.fillStyle = '#2865C7') : (ctx.fillStyle = 'rgba(255, 255, 255, 0)');
        ctx.fillRect(p.offset, 0, p.width, height);
        p.isDarkMode ? (ctx.fillStyle = '#FFF') : (ctx.fillStyle = '#000');
        ctx.font = '10px';
        ctx.fillText(p.rename, p.offset, height / 2 - 1);
        ctx.fillText(p.price, p.offset, height - 1);
      }
      const dataImg = canvas.toDataURL('image/png');
      ipcRenderer.send('showImg', dataImg, width, height);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.about canvas {
  display: none;
}
</style>
