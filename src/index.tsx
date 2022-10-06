import './index.css'
import 'antd/dist/antd.css';
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { StoreProvider } from 'easy-peasy';
import store from './store';

ReactDOM.render(
  <StoreProvider store={store}>
    <App />
  </StoreProvider>,
document.getElementById('root'))
