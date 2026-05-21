export interface ProxyTableData {
  id: string
  proxy_ip: string
  proxy_port: number
  protocol: string
  username: string
  password: string
  description: string
  status: ProxyStatus
  created_at?: string
  updated_at?: string
  jobs?: any[]
}

export enum ProxyActions {
  UNLINK,
  DELETE,
  UPDATE,
  CREATE,
  LINK,
  TEST,
}

export enum ProxyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export const proxyProtocolOptions = [
  {
    value: "http",
    label: "HTTP",
  },
  {
    value: "https",
    label: "HTTPS",
  },
  {
    value: "socks4",
    label: "SOCKS4",
  },
  {
    value: "socks5",
    label: "SOCKS5",
  },
]
