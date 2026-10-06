import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "@/app/createAppSlice"
import type { LoginFormData, SavedUserData } from "@/models/auth"
import Cookies from "js-cookie"

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  INPROGRESS = "INPROGRESS",
  DISCONNECTED = "DISCONNECTED",
}

export interface AuthenticationSliceState {
  authToken?: string
  user?: SavedUserData
  connectionStatus: ConnectionStatus
}

const initialState: AuthenticationSliceState = {
  authToken: undefined,
  connectionStatus: ConnectionStatus.INPROGRESS,
}

// If you are not using async thunks you can use the standalone `createSlice`.
export const AuthenticationSlice = createAppSlice({
  name: "auth",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: create => ({
    setConnectionStatus: create.reducer(
      (
        state: AuthenticationSliceState,
        action: PayloadAction<ConnectionStatus>,
      ) => {
        state.connectionStatus = action.payload
      },
    ),
    setUser: create.reducer(
      (
        state: AuthenticationSliceState,
        action: PayloadAction<SavedUserData>,
      ) => {
        state.user = action.payload
      },
    ),
    disconnect: create.reducer((state: AuthenticationSliceState) => {
      cookieStore.delete("access_token")
      state.authToken = undefined
      state.user = undefined
      state.connectionStatus = ConnectionStatus.DISCONNECTED
    }),
  }),
  // You can define your selectors here. These selectors receive the slice
  // state as their first argument.
  selectors: {
    auth_token: state => state.authToken,
    user: state => state.user,
    connectionStatus: state => state.connectionStatus,
  },
})

// Action creators are generated for each case reducer function.
export const { setUser, disconnect, setConnectionStatus } =
  AuthenticationSlice.actions

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { auth_token, user, connectionStatus } =
  AuthenticationSlice.selectors
