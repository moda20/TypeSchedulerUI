import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import systemService from "@/services/SystemService"
import {
  JobProxyLinkUpdateType,
  ProxyActions,
  ProxyConfigUpdateType,
  type ProxyTableData,
} from "@/models/proxies"
import { Row } from "@tanstack/react-table"
import { toast } from "@/hooks/use-toast"
import { useCallback, useMemo } from "react"

export interface UseProxyProps {
  filters?: {
    limit?: number
    offset?: number
    search?: string
  }
}

export function useProxies(props?: UseProxyProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["proxies", "all", props?.filters],
    queryFn: () =>
      systemService.getAllProxies({
        limit: props?.filters?.limit,
        offset: props?.filters?.offset,
        search: props?.filters?.search,
      }),
    enabled: true,
    placeholderData: [],
  })

  const proxyItems = useMemo(() => {
    return data?.map((item: any) => {
      return {
        value: item.id?.toString(),
        label: `${item.proxy_ip}:${item.proxy_port}`,
      }
    })
  }, [data])

  const jobProxies = useCallback((jobId: number) => {
    return systemService.getJobProxies(jobId)
  }, [])

  const createMutation = useMutation({
    mutationFn: systemService.addProxy,
    onSuccess: async (data, variables) => {
      toast({
        title: `Proxy ${variables?.proxy_ip}:${variables?.proxy_port} created`,
        duration: 2000,
      })
      await queryClient.invalidateQueries({
        queryKey: ["proxies", "all"],
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error creating proxy",
        description: error.message,
        variant: "destructive",
      })
    },
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => systemService.updateProxy(d.id, d),
    onSuccess: async (data, vars) => {
      toast({
        title: `Proxy with id = ${vars.id} updated`,
        duration: 2000,
      })
      await queryClient.invalidateQueries({
        queryKey: ["proxies", "all"],
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error updating proxy",
        description: error.message,
        variant: "destructive",
      })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: systemService.deleteProxy,
    onSuccess: async (data, id) => {
      toast({
        title: `Proxy with id = ${id} deleted`,
        duration: 2000,
      })
      await queryClient.invalidateQueries({
        queryKey: ["proxies", "all"],
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error deleting proxy",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const linkMutation = useMutation({
    mutationFn: (d: any) => systemService.addProxyToJob(d.id, d.jobs),
    onSuccess: async (data, vars) => {
      toast({
        title: `Proxy with id = ${vars.id} linked to jobs`,
        duration: 2000,
      })
      await queryClient.invalidateQueries({
        queryKey: ["proxies", "all"],
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error linking proxy to jobs",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const jobLinkMutation = useMutation({
    mutationFn: (d: any) =>
      systemService.addProxiesToASingleJob(d.id, d.proxies),
    onSuccess: async (data, vars) => {
      toast({
        title: `${vars.proxies.length} proxies linked to a job`,
        duration: 2000,
      })
      await queryClient.invalidateQueries({
        queryKey: ["proxies"],
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error linking proxies to job",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const testMutation = useMutation({
    mutationFn: systemService.testProxy,
    onMutate: (id, _context) => {
      toast({
        title: `Proxy with id = ${id} test started`,
        duration: 2000,
      })
    },
    onSuccess: async (data, id) => {
      toast({
        title: `Proxy with id = ${id} test successful`,
        duration: 2000,
      })
    },
    onError: (error, variables) => {
      toast({
        title: "Error testing proxy, check system logs",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const proxyActions = (
    action: ProxyActions,
    row?: Row<ProxyTableData>,
    proxyData?: ProxyConfigUpdateType,
    jobProxyLinkData?: JobProxyLinkUpdateType,
  ) => {
    switch (action) {
      case ProxyActions.UPDATE:
        if (proxyData?.status !== undefined)
          return updateMutation.mutateAsync({
            id: row?.original?.id,
            ...proxyData,
          })
        break
      case ProxyActions.CREATE: {
        return createMutation.mutateAsync(proxyData!)
      }
      case ProxyActions.DELETE:
        return deleteMutation.mutateAsync(row!.original?.id)
      case ProxyActions.LINK:
        return linkMutation.mutateAsync({
          id: proxyData!.id!,
          jobs: proxyData!.jobs!.map(e => Number(e)),
        })
      case ProxyActions.LINK_TO_JOBS:
        return jobLinkMutation.mutateAsync({
          id: Number(jobProxyLinkData!.id),
          proxies: jobProxyLinkData!.proxies.map(e => Number(e)),
        })
      case ProxyActions.TEST:
        return testMutation.mutateAsync(Number(row?.original?.id))
      default:
        break
    }
  }

  return {
    proxies: data,
    proxyItems,
    isLoading,
    proxyActions,
    jobProxies,
  }
}
