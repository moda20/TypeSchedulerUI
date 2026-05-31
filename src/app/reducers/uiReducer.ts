import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "@/app/createAppSlice"
import { routesList } from "@/router/routeslist"
import { saveConfig, SavedConfigInterface } from "@/utils/initializer"

export interface ToastObject {
  title: string
  description?: string
  type?: "success" | "error" | "warning" | "info"
}

export interface RouteObject {
  id: string
  title: string
  url: string
  active?: boolean
  items?: Array<RouteObject>
  parent?: RouteObject
}
export interface UISliceState {
  toasts: Array<ToastObject>
  routes: Array<RouteObject> | null
  activeRoute: Array<RouteObject> | null
  config: SavedConfigInterface
  dialogStack: Array<string>
  dialogGroups: {
    [key: string]: string[]
  }
}

const initialState: UISliceState = {
  toasts: [],
  routes: routesList,
  activeRoute: [routesList[0], routesList[0].items[0]],
  config: {},
  dialogStack: [],
  dialogGroups: {},
}

// If you are not using async thunks you can use the standalone `createSlice`.
export const UiReducerSlice = createAppSlice({
  name: "ui",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: create => ({
    showToast: create.reducer(
      (state: UISliceState, action: PayloadAction<ToastObject>) => {},
    ),
    disconnect: create.reducer((state: UISliceState) => {}),
    changeRoute: create.reducer(
      (state: UISliceState, action: PayloadAction<RouteObject[]>) => {
        const parentRoute = state?.routes?.find(
          e => e?.id === action.payload[0].id,
        )
        const route = parentRoute?.items?.find(
          e => e?.id === action.payload[1].id,
        )
        if (route) {
          state?.routes?.forEach(e => {
            e?.items?.forEach(e => {
              e.active = false
            })
          })
          route.active = true
          state.activeRoute = [parentRoute!, route]
        }
      },
    ),
    setConfigItem: create.reducer(
      (
        state: UISliceState,
        action: PayloadAction<
          { name: string; value: any } | Array<{ name: string; value: any }>
        >,
      ) => {
        if (Array.isArray(action.payload)) {
          action.payload.forEach(e => {
            state.config[e.name as keyof SavedConfigInterface] = e.value
          })
        } else {
          state.config[action.payload.name as keyof SavedConfigInterface] =
            action.payload.value
        }
        saveConfig(state.config)
      },
    ),
    openDialog: create.reducer(
      (
        state: UISliceState,
        action: PayloadAction<{ cptId: string; group?: string }>,
      ) => {
        if (!state.dialogStack.includes(action.payload?.cptId)) {
          state.dialogStack.push(action.payload?.cptId)
        }
        if (action.payload?.group) {
          if (!state.dialogGroups[action.payload?.group]) {
            state.dialogGroups[action.payload?.group] = [action.payload?.cptId]
          } else {
            state.dialogGroups[action.payload?.group]?.push(
              action.payload?.cptId,
            )
          }
        }
      },
    ),
    closeTopDialog: create.reducer(
      (state: UISliceState, action?: PayloadAction<string | undefined>) => {
        if (action?.payload) {
          if (
            state.dialogStack[state.dialogStack.length - 1] !== action?.payload
          )
            return
        }
        state.dialogStack.splice(-1, 1)
      },
    ),
    closeAllGroupedDialogs: create.reducer(
      (state: UISliceState, action: PayloadAction<string>) => {
        const dialogs = state.dialogGroups[action.payload]
        dialogs?.forEach(e => {
          if (state.dialogStack.indexOf(e) !== -1) {
            state.dialogStack.splice(state.dialogStack.indexOf(e), 1)
          }
        })
        delete state.dialogGroups[action.payload]
      },
    ),
  }),
  // You can define your selectors here. These selectors receive the slice
  // state as their first argument.
  selectors: {
    routes: (state: UISliceState) => state.routes,
    currentRoute: (state: UISliceState) => state.activeRoute,
    config: (state: UISliceState) => state.config,
    dialogStack: (state: UISliceState) => state.dialogStack,
  },
})

// Action creators are generated for each case reducer function.
export const {
  changeRoute,
  setConfigItem,
  openDialog,
  closeTopDialog,
  closeAllGroupedDialogs,
} = UiReducerSlice.actions

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { routes, currentRoute, config, dialogStack } =
  UiReducerSlice.selectors
