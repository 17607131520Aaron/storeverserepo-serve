import { installWSLogger } from './ws-log-forwarder'
// installWSLogger()

// if (__DEV__) {
//   // 方式1：直接设置（推荐）
//   global.__LOG_SERVER_IP__ = '172.23.100.231' // 替换为你的开发机 IP

//   // 方式2：从环境变量读取（如果使用 react-native-config）
//   // import Config from 'react-native-config'
//   // global.__LOG_SERVER_IP__ = Config.DEV_SERVER_IP

//   // 安装日志转发器
//   installWSLogger()
// }