const { app, Menu, ipcMain, BrowserWindow, nativeImage, Tray } = require('electron');
const https = require('https');

let trayObj = {};
let symbolFilter = ['BNBUSDT', 'LTCUSDT'];
let refreshTime = 1000;
let imageWin = null;

let getPrice = () => {
  https
    .get('https://api.binance.com/api/v3/ticker/price', res => {
      let rawData = '';
      res.on('data', chunk => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          let d = JSON.parse(rawData);
          for (const p of d) {
            if (symbolFilter.indexOf(p.symbol) > -1) {
              p.price = parseFloat(p.price);
              imageWin.webContents.send('genImg', p);
            }
          }
        } catch (error) {
          // error
          console.log(error);
        }
      });
    })
    .on('error', e => {
      console.error(e);
    });

  setTimeout(getPrice, refreshTime);
};

app.dock.hide();
app.on('ready', () => {
  trayObj = {};

  let tray = new Tray(`${__dirname}/icon.png`);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function() {
        app.quit();
      }
    }
  ]);
  tray.setToolTip('price');
  tray.setContextMenu(contextMenu);

  trayObj.main = tray;

  for (const s of symbolFilter) {
    trayObj[s] = new Tray(`${__dirname}/icon.png`);
  }

  if (process.env.NODE_ENV) {
    imageWin = new BrowserWindow({ width: 800, height: 600, frame: true, webPreferences: { nodeIntegration: true } });
    imageWin.webContents.openDevTools();
    app.dock.show();
  } else {
    imageWin = new BrowserWindow({ width: 0, height: 0, frame: true, webPreferences: { nodeIntegration: true } });
  }

  imageWin.loadURL(`file://${__dirname}/app/image.html`);

  setTimeout(getPrice, refreshTime);
});

ipcMain.on('showImg', (event, img, content, width, height) => {
  trayObj[content.symbol].setImage(nativeImage.createFromDataURL(img).resize({ width, height }));
});
