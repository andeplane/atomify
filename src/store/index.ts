import { createStore } from "easy-peasy";
import { storeModel, StoreModel } from "./model";

const store = createStore<StoreModel>(storeModel);

// Added support for hot reloading
// Vite uses import.meta.hot instead of module.hot
if (import.meta.env.DEV) {
  if (import.meta.hot) {
    import.meta.hot.accept("./model", () => {
      store.reconfigure(storeModel); // 👈 Here is the magic
    });
  }
}

export default store;
