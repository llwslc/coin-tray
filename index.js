const { app, Menu, ipcMain, BrowserWindow, nativeImage, nativeTheme, Tray } = require('electron');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const refreshTime = 1000;
let trayObj = {};
let symbolFilter = {};
let settingsWin = null;
let imageWin = null;
let baseUrl = 'http://localhost:8080/#';
let symbolCache = [];
let settingsFileName = 'settings';
let settingsFilePath = '';

const useProxy = false;
const priceUrl = 'https://data.gateio.life/api2/1/marketlist';

const getPrice = () => {
  const mHttp = useProxy ? http : https;
  const url = useProxy
    ? {
        host: '127.0.0.1',
        port: 7890,
        path: priceUrl
      }
    : priceUrl;

  mHttp
    .get(url, res => {
      let rawData = '';
      res.on('data', chunk => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const d = JSON.parse(rawData);
          const symbolArr = Object.keys(symbolFilter);
          const imgData = [];
          symbolCache = d.data;
          for (const p of symbolCache) {
            p.symbol = p.pair;
            p.price = p.rate;
            if (symbolArr.indexOf(p.symbol) > -1) {
              p.price = parseFloat(p.price);
              p.rename = symbolFilter[p.symbol].rename;
              if (p.price >= symbolFilter[p.symbol].high || p.price <= symbolFilter[p.symbol].low) {
                p.warning = true;
              } else {
                p.warning = false;
              }
              imgData.push(p);
            }
          }
          imageWin.webContents.send('genImg', imgData);
        } catch (error) {
          // error
          console.error(`[${new Date().toLocaleTimeString('en-GB')}]api: ${error.message}`);
        }

        setTimeout(getPrice, refreshTime);
      });
    })
    .on('error', error => {
      console.error(`[${new Date().toLocaleTimeString('en-GB')}]http: ${error.message}`);
      setTimeout(getPrice, refreshTime);
    });
};

const readSettings = () => {
  symbolFilter = {};
  settingsFilePath = path.join(app.getPath('userData'), settingsFileName);
  if (fs.existsSync(settingsFilePath)) {
    const settingsString = fs.readFileSync(settingsFilePath);
    try {
      const settingsJson = JSON.parse(settingsString);
      symbolFilter = settingsJson;
    } catch (error) {
      console.log('setting: ', error);
    }
  }
};

const defaultIcon = () => {
  const iconImg = nativeImage.createFromPath(`${__dirname}/icon/icon.png`).resize({ width: 22, height: 22 });
  iconImg.setTemplateImage(true);
  return iconImg;
};

app.allowRendererProcessReuse = true;
app.dock.hide();
app.on('ready', () => {
  trayObj = new Tray(defaultIcon());
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '设置',
      click: () => {
        if (settingsWin) {
          settingsWin.show();
        } else {
          settingsWin = new BrowserWindow({
            width: 800,
            height: 600,
            frame: true,
            webPreferences: { nodeIntegration: true }
          });
          if (process.env.NODE_ENV) {
            settingsWin.webContents.openDevTools();
          }
          settingsWin.on('close', () => {
            settingsWin = null;
          });
          settingsWin.maximize();
          settingsWin.loadURL(`${baseUrl}`);
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  trayObj.setToolTip('price');
  trayObj.setContextMenu(contextMenu);

  readSettings();

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
    imageWin = new BrowserWindow({
      width: 0,
      height: 0,
      frame: true,
      show: false,
      webPreferences: { nodeIntegration: true }
    });
  }

  imageWin.loadURL(`${baseUrl}/about`);

  getPrice();
});

ipcMain.on('showImg', (event, img, width, height) => {
  const iconImg = nativeImage.createFromDataURL(img).resize({ width, height });
  iconImg.setTemplateImage(true);
  trayObj.setImage(iconImg);
});

ipcMain.on('getSettings', event => {
  event.reply('getSettings', { symbols: symbolCache, symbolFilter });
});

ipcMain.on('updateSettings', (event, _symbolFilter) => {
  symbolFilter = _symbolFilter;
  const settingsString = JSON.stringify(symbolFilter);
  fs.writeFileSync(settingsFilePath, settingsString);

  if (!Object.keys(symbolFilter).length) {
    trayObj.setImage(defaultIcon());
  }
});

ipcMain.on('searchSymbol', (event, symbol, opt) => {
  if (symbol) {
    event.sender.webContents.findInPage(symbol, opt);
  } else {
    event.sender.webContents.stopFindInPage('clearSelection');
  }
});

process.on('uncaughtException', function (error) {
  console.log(error);
});
