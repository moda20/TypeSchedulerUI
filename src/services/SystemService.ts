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
  getAllProxies(): Promise<Array<ProxyTableData>> {
    return axios.get("/proxies/getAllProxies")
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
  deleteProxy(id: number | string): Promise<any> {
    return axios.delete("/proxies/deleteProxy", {
      params: {
        id,
      },
    })
  },
  getVersion(): Promise<any> {
    return axios.get("/status/version")
  },
}

export default systemService
