const { app, Menu, ipcMain, BrowserWindow, nativeImage, Tray } = require('electron');
const https = require('https');
const path = require('path');
const fs = require('fs');

let trayObj = {};
let symbolFilter = {};
let refreshTime = 1000;
let settingsWin = null;
let imageWin = null;
let baseUrl = 'http://localhost:8080/#';
let symbolCache = [];
let settingsFileName = 'settings';
let settingsFilePath = '';

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
          let symbolArr = Object.keys(symbolFilter);
          symbolCache = d;
          for (const p of d) {
            if (symbolArr.indexOf(p.symbol) > -1) {
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

let readSettings = () => {
  symbolFilter = {};
  settingsFilePath = path.join(app.getPath('userData'), settingsFileName);
  if (fs.existsSync(settingsFilePath)) {
    let settingsString = fs.readFileSync(settingsFilePath);
    try {
      let settingsJson = JSON.parse(settingsString);
      symbolFilter = settingsJson;
    } catch (error) {
      console.log(error);
    }
  }
};

app.dock.hide();
app.on('ready', () => {
  trayObj = {};

  let tray = new Tray(`${__dirname}/icon.png`);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '设置',
      click: function() {
        if (settingsWin) {
          settingsWin.show();
        } else {
          settingsWin = new BrowserWindow({ width: 800, height: 600, frame: true, webPreferences: { nodeIntegration: true } });
          if (process.env.NODE_ENV) {
            settingsWin.webContents.openDevTools();
          }
          settingsWin.on('close', function() {
            settingsWin = null;
          });
          settingsWin.maximize();
          settingsWin.loadURL(`${baseUrl}`);
        }
      }
    },
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

  readSettings();

  for (const s of Object.keys(symbolFilter)) {
    trayObj[s] = new Tray(`${__dirname}/icon.png`);
  }

  if (process.env.NODE_ENV) {
    imageWin = new BrowserWindow({ width: 800, height: 600, frame: true, webPreferences: { nodeIntegration: true } });
    imageWin.webContents.openDevTools();
    imageWin.maximize();
    app.dock.show();

    if (process.env.NODE_ENV == 'build') {
      baseUrl = `file://${__dirname}/app/dist/index.html#`;
    }
  } else {
    baseUrl = `file://${__dirname}/app/dist/index.html#`;
    imageWin = new BrowserWindow({ width: 0, height: 0, frame: true, show: false, webPreferences: { nodeIntegration: true } });
  }

  imageWin.loadURL(`${baseUrl}/about`);

  getPrice();
});

ipcMain.on('showImg', (event, img, content, width, height) => {
  if (trayObj[content.symbol]) {
    trayObj[content.symbol].setImage(nativeImage.createFromDataURL(img).resize({ width, height }));
  }
});

ipcMain.on('getSettings', event => {
  event.reply('getSettings', { symbols: symbolCache, symbolFilter });
});

ipcMain.on('updateSettings', (event, _symbolFilter) => {
  symbolFilter = _symbolFilter;
  let settingsString = JSON.stringify(symbolFilter);
  fs.writeFileSync(settingsFilePath, settingsString);

  for (const sf in symbolFilter) {
    if (trayObj[sf]) {
      trayObj[sf].destroy();
      trayObj[sf] = null;
    }
  }
});
