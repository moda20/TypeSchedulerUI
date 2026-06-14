import axios from "@/lib/httpUtils"
import type { ProxyTableData } from "@/models/proxies"
import type { ProxyConfigUpdateType } from "@/components/custom/system/ProxyConfigDialog"
import { downloadFile } from "@/utils/serviceUtils"

const systemService = {
  getDatabaseInformation(): Promise<any> {
    return axios.get("/system/getDbConnection")
  },
  downloadSchedulerDBBackupFile(): Promise<any> {
    return axios
      .get("/system/backupAndDownloadSchedulerDB", {
        responseType: "arraybuffer",
        fetchOptions: {
          fullResponse: true,
          onlyJSON: false,
        },
      })
      .then(response => downloadFile(response, "application/zip"))
  },
  getBaseDatabaseInformation(): Promise<any> {
    return axios.get("/system/getBaseDbConnection")
  },
  downloadBaseDBBackupFile(): Promise<any> {
    return axios
      .get("/system/backupAndDownloadBaseDB", {
        responseType: "arraybuffer",
        fetchOptions: {
          fullResponse: true,
          onlyJSON: false,
        },
      })
      .then(response => downloadFile(response, "application/zip"))
  },
  getAllProxies({
    limit,
    offset,
    search,
  }: {
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<Array<ProxyTableData>> {
    return axios.get("/proxies/getAllProxies", {
      params: {
        limit,
        offset,
        search,
      },
    })
  },
  getJobProxies(jobId: number): Promise<any> {
    return axios.get("/proxies/getJobProxies", {
      params: {
        jobId,
      },
    })
  },
  updateProxy(id: number, proxyData: ProxyConfigUpdateType): Promise<any> {
    return axios.put("/proxies/updateProxy", {
      id,
      ...proxyData,
    })
  },
  addProxy(proxyData: ProxyConfigUpdateType): Promise<any> {
    return axios.post("/proxies/addProxy", proxyData)
  },
  addProxyToJob(id: number | string, jobIds: Array<number>): Promise<any> {
    return axios.post("/proxies/addProxyToJob", {
      id,
      job_ids: jobIds,
    })
  },
  addProxiesToASingleJob(jobId: number, proxyIds: Array<number>): Promise<any> {
    return axios.post("/proxies/addProxiesToJob", {
      job_id: jobId,
      proxy_ids: proxyIds,
    })
  },
  deleteProxy(id: number | string): Promise<any> {
    return axios.delete("/proxies/deleteProxy", {
      params: {
        id,
      },
    })
  },
  testProxy(id: number): Promise<any> {
    return axios.post("/proxies/testProxy", { id })
  },
  getVersion(): Promise<any> {
    return axios.get("/status/version")
  },
}

export default systemService
