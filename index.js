const { app, Menu, ipcMain, BrowserWindow, nativeImage, nativeTheme, Tray } = require('electron');
const http = require('http');
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
let isDarkMode = nativeTheme.shouldUseDarkColors;

let getPrice = () => {
  http
    .get(
      {
        host: '127.0.0.1',
        port: 7890,
        path: 'https://data.gateio.life/api2/1/marketlist'
      },
      res => {
        let rawData = '';
        res.on('data', chunk => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            let d = JSON.parse(rawData);
            let symbolArr = Object.keys(symbolFilter);
            symbolCache = d.data;
            for (const p of symbolCache) {
              p.symbol = p.pair;
              p.price = p.rate;
              if (symbolArr.indexOf(p.symbol) > -1) {
                p.price = parseFloat(p.price);
                p.rename = symbolFilter[p.symbol].rename;
                p.isDarkMode = nativeTheme.shouldUseDarkColors;
                if (p.price >= symbolFilter[p.symbol].high || p.price <= symbolFilter[p.symbol].low) {
                  p.warning = true;
                } else {
                  p.warning = false;
                }
                imageWin.webContents.send('genImg', p);
              }
            }
          } catch (error) {
            // error
            console.log('api: ', error);
          }
        });
      }
    )
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
      console.log('setting: ', error);
    }
  }
};

let defaultIcon = () => {
  return nativeImage
    .createFromPath(`${__dirname}/icon/icon_${isDarkMode ? 'white' : 'black'}.png`)
    .resize({ width: 22, height: 22 });
};

let setMainTray = () => {
  if (isDarkMode != nativeTheme.shouldUseDarkColors) {
    isDarkMode = nativeTheme.shouldUseDarkColors;
    trayObj.main.setImage(defaultIcon());
  }

  setTimeout(() => {
    setMainTray();
  }, refreshTime);
};

app.dock.hide();
app.on('ready', () => {
  trayObj = {};

  let tray = new Tray(defaultIcon());
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
  tray.setToolTip('price');
  tray.setContextMenu(contextMenu);

  trayObj.main = tray;

  readSettings();
  setMainTray();

  for (const s of Object.keys(symbolFilter)) {
    trayObj[s] = new Tray(defaultIcon());
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

ipcMain.on('showImg', (event, img, data, width, height) => {
  if (trayObj[data.symbol]) {
    trayObj[data.symbol].setImage(nativeImage.createFromDataURL(img).resize({ width, height }));
  }
});

ipcMain.on('getSettings', event => {
  event.reply('getSettings', { symbols: symbolCache, symbolFilter });
});

ipcMain.on('updateSettings', (event, _symbolFilter) => {
  symbolFilter = _symbolFilter;
  let settingsString = JSON.stringify(symbolFilter);
  fs.writeFileSync(settingsFilePath, settingsString);

  let symbolArr = Object.keys(symbolFilter);
  symbolArr.push('main');
  for (const s in trayObj) {
    if (symbolArr.indexOf(s) == -1) {
      if (trayObj[s]) {
        trayObj[s].destroy();
        trayObj[s] = null;
      }
    }
  }

  for (const s of symbolArr) {
    if (!trayObj[s]) {
      trayObj[s] = new Tray(defaultIcon());
    }
  }
});

ipcMain.on('searchSymbol', (event, symbol, opt) => {
  if (symbol) {
    event.sender.webContents.findInPage(symbol, opt);
  } else {
    event.sender.webContents.stopFindInPage('clearSelection');
  }
});
