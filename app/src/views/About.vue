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
    ipcRenderer.on('genImg', (event, arg) => {
      if (arg) {
        generateInfoImg(arg);
      }
    });

    let canvas = document.getElementById('canvas');
    let dpr = window.devicePixelRatio || 1;
    let ctx = canvas.getContext('2d');

    function generateInfoImg(content) {
      let width = 50;
      let height = 22;

      ctx.font = '10px';
      let sWidth = ctx.measureText(content.rename).width;
      let pWidth = ctx.measureText(content.price).width;
      width = sWidth > pWidth ? sWidth : pWidth;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      content.warning ? (ctx.fillStyle = '#2865C7') : (ctx.fillStyle = 'rgba(255, 255, 255, 0)');
      ctx.fillRect(0, 0, width, height);
      content.isDarkMode ? (ctx.fillStyle = '#FFF') : (ctx.fillStyle = '#000');
      ctx.font = '10px';
      ctx.fillText(content.rename, 0, height / 2 - 1);
      ctx.fillText(content.price, 0, height - 1);
      let dataImg = canvas.toDataURL('image/png');
      ipcRenderer.send('showImg', dataImg, content, width, height);
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
