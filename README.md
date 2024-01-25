# Electron Bridge

Easily define and use IPC functions and events in your Electron app. Fully typesafe.
 
## Installation
```bash
npm install @nlfmt/electron-bridge
```

```bash
pnpm add @nlfmt/electron-bridge
```

```bash
yarn add @nlfmt/electron-bridge
```

## Usage

This library is designed to be used with electron apps that enable `contextIsolation`, `sandbox` and disable `nodeIntegration`.

### Create bridge

```ts
// bridge.ts
import { createBridge, createBridgeRouter } from '@nlfmt/electron-bridge'
  
// You can place routers in separate files and import them here
const exampleRouter = createBridgeRouter({
  log: (e, message: string) => {
    console.log("Message from IPC:", message)
  },
})

export const bridge = createBridge({
  example: exampleRouter,
})
```

### Register bridge

```ts
// main.ts
import { bridge } from './bridge'

// This will call ipcMain.handle() under-the-hood and set up all listeners
// Don't forget to call this before you send any IPC messages
bridge.register()
```

### Register preload script
If you have `sandbox` enabled, you wont be able to import `registerBridgePreload`,
unless you are using a bundler, such as `vite` with the `vite-plugin-electron` plugin.
For a workaround, see the [Issues](#issues) section.

```ts
// preload.ts
import { registerBridgePreload } from '@nlfmt/electron-bridge/preload'

registerBridgePreload()
```

### Use bridge

```tsx
// App.tsx
import { createBridgeRenderer } from '@nlfmt/electron-bridge/renderer'

// Usually would be defined in a separate file like `bridge.ts`
export const bridge = createBridgeRenderer()

function App() {
  return (
    <button onClick={() => bridge.api.example.log("Hello from App.tsx")}>
      Send message
    </button>
  )
}

export default App
```


## Issues
### Preload scripts without a bundler

If you are not using a bundler, you can use the following workaround to register everything needed by the bridge:
```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('__bridge', {
  invoke: ipcRenderer.invoke,
  send: ipcRenderer.send,
  on: ipcRenderer.on,
  once: ipcRenderer.once,
  off: ipcRenderer.off
})
```

## License

See [LICENSE](LICENSE) for more information.
