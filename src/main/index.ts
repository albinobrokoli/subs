import { app, shell, BrowserWindow, ipcMain, Notification, nativeTheme, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import {
  getState,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  archiveSubscription,
  addCategory,
  updateCategory,
  deleteCategory,
  setCurrency,
  setArchivedVisible,
  setPrefs,
  getMeta,
  getUpcomingPayments,
} from './store'

const isDev = !app.isPackaged
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let notifyTimer: NodeJS.Timeout | null = null
const notifiedToday = new Set<string>()
let isQuitting = false

// Enable CSS backdrop-filter (liquid glass) in Electron
app.commandLine.appendSwitch('enable-features', 'CSSBackdropFilter')

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1000,
    minHeight: 680,
    show: false,
    title: 'Subs',
    backgroundColor: '#111318',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    icon: join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Hide on close instead of quitting — keeps notifications alive
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
      return false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  // Simple tray with context menu
  try {
    const iconPath = join(__dirname, '../build/icon.png')
    const image = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 })
    tray = new Tray(image)
    tray.setToolTip('Subs — Abonelik yöneticisi')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Subs\'ı Aç',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        },
      },
      { type: 'separator' },
      {
        label: 'Bildirimleri Kontrol Et',
        click: () => fireUpcomingNotifications(),
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ])

    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })
  } catch (e) {
    console.error('tray creation failed:', e)
  }
}

function registerIpc(): void {
  ipcMain.handle('store:getState', () => getState())
  ipcMain.handle('store:getMeta', () => getMeta())
  ipcMain.handle('subs:add', (_e, sub) => addSubscription(sub))
  ipcMain.handle('subs:update', (_e, id, patch) => updateSubscription(id, patch))
  ipcMain.handle('subs:delete', (_e, id) => deleteSubscription(id))
  ipcMain.handle('subs:archive', (_e, id, archived) => archiveSubscription(id, archived))
  ipcMain.handle('cats:add', (_e, cat) => addCategory(cat))
  ipcMain.handle('cats:update', (_e, id, patch) => updateCategory(id, patch))
  ipcMain.handle('cats:delete', (_e, id) => deleteCategory(id))
  ipcMain.handle('prefs:setCurrency', (_e, currency) => setCurrency(currency))
  ipcMain.handle('prefs:setArchivedVisible', (_e, visible) => setArchivedVisible(visible))
  ipcMain.handle('prefs:set', (_e, prefs) => {
    const result = setPrefs(prefs)
    if (prefs.theme && ['system', 'light', 'dark'].includes(prefs.theme)) {
      nativeTheme.themeSource = prefs.theme
    }
    return result
  })
  ipcMain.handle('notify:checkUpcoming', () => {
    fireUpcomingNotifications()
    return getUpcomingPayments(3)
  })
}

function fireUpcomingNotifications(): void {
  if (!Notification.isSupported()) return
  const todayKey = new Date().toISOString().slice(0, 10)
  for (const sub of getUpcomingPayments(3)) {
    const key = `${todayKey}:${sub.id}`
    if (notifiedToday.has(key)) continue
    notifiedToday.add(key)
    const when = sub.days === 0 ? 'bugün' : sub.days === 1 ? 'yarın' : `${sub.days} gün içinde`
    new Notification({
      title: 'Yaklaşan abonelik ödemesi',
      body: `${sub.name} ${when} ödenecek (${sub.price} ${sub.currency}).`,
    }).show()
  }
}

app.whenReady().then(() => {
  try {
    const meta = getMeta()
    if (meta.theme && ['system', 'light', 'dark'].includes(meta.theme)) {
      nativeTheme.themeSource = meta.theme
    } else {
      nativeTheme.themeSource = 'dark'
    }
  } catch {
    nativeTheme.themeSource = 'dark'
  }
  registerIpc()
  createWindow()
  createTray()

  // Check notifications on launch + every 6 hours
  setTimeout(() => fireUpcomingNotifications(), 3000)
  notifyTimer = setInterval(() => fireUpcomingNotifications(), 6 * 60 * 60 * 1000)

  app.on('activate', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // Don't quit on macOS — keep running in background for notifications
  if (notifyTimer) clearInterval(notifyTimer)
  if (process.platform !== 'darwin') app.quit()
})
