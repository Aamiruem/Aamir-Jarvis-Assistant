import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import tasks from "@/store/tasks-slice";

// A function, not a module-level singleton: on the server each request needs its own store,
// otherwise one user's data could leak into another user's render.
export const makeStore = () => configureStore({ reducer: { tasks } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
