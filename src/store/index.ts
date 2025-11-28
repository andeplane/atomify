import { createStore } from "easy-peasy";
import { storeModel, StoreModel } from "./model";

const store = createStore<StoreModel>(storeModel);

// Added support for hot reloading
// Wrapping dev only code like this normally gets stripped out by bundlers
// such as Vite when creating a production build.
if (import.meta.env.DEV) {
  if (import.meta.hot) {
    import.meta.hot.accept("./model", () => {
      store.reconfigure(storeModel); // 👈 Here is the magic
    });
  }
}

export default store;
