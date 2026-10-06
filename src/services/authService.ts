import axios, { loginService } from "@/lib/httpUtils"
import type { LoginFormData, RegisterFormData } from "@/models/auth"
export default {
  login(data: LoginFormData): Promise<any> {
    return loginService.post("/auth/login", data, {
      baseURL: data.host,
    })
  },
  register(data: RegisterFormData): Promise<any> {
    return loginService.post("/auth/register", data, {
      baseURL: data.host,
    })
  },
  me(): any {
    return axios.get("/auth/me")
  },
}
