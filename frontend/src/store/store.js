import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  restoreSession,
} from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

store.dispatch(restoreSession());