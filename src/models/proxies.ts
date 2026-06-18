import { z } from "zod/v4"

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
  LINK_TO_JOBS,
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

export enum ProxyStrategyOptionEnum {
  RANDOM = "RANDOM",
  ROUND_ROBIN = "ROUND_ROBIN",
  SPECIFIC = "SPECIFIC",
  LEAST_USED = "LEAST_USED",
}
export const ProxyStrategyOptions = [
  { value: ProxyStrategyOptionEnum.RANDOM, label: "Random" },
  { value: ProxyStrategyOptionEnum.ROUND_ROBIN, label: "Round Robin" },
  { value: ProxyStrategyOptionEnum.SPECIFIC, label: "Specific" },
  { value: ProxyStrategyOptionEnum.LEAST_USED, label: "Least Used" },
  { value: undefined, label: "First linked (default)" },
]

export const ProxyUpdateSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  proxy_ip: z.string(),
  proxy_port: z.coerce.number().positive().max(65535),
  description: z.string().optional(),
  status: z.union([z.nativeEnum(ProxyStatus), z.number()]).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  protocol: z.string().optional(),
  jobs: z.array(z.number()).optional(),
})

export type ProxyConfigUpdateType = z.infer<typeof ProxyUpdateSchema>

export const JobProxyLinkUpdateSchema = z.object({
  id: z.union([z.number(), z.string()]),
  proxies: z.array(z.any()).optional(),
  strategy: z.string().optional(),
  proxyId: z.string().optional(),
})

export type JobProxyLinkUpdateType = z.infer<typeof JobProxyLinkUpdateSchema>
