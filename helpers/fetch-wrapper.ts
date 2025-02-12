import getConfig from "next/config";
import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse
} from "axios"

import { userService } from '../services';

const { publicRuntimeConfig } = getConfig();

const get = (url: string) => {
  const config: AxiosRequestConfig = {
    // method: 'get',
    headers: { 'Accept': 'application/json', ...authHeader(url) },
    // withCredentials: true,
  }
  //console.log(config)
  return axios.get(url, config).then(handleResponse)
}

const post = (url: string, data: object, header: AxiosRequestHeaders) => {
  const config: AxiosRequestConfig = {
    // method: 'post',
    headers: { ...header, ...authHeader(url) },
    // withCredentials: true,
  }
  //console.log(config)
  //console.log(data)
  return axios.post(url, data, config).then(handleResponse)
}

const put = (url: string, data: object = {}) => {
  const config: AxiosRequestConfig = {
    // method: 'put',
    headers: { 'Accept': 'application/json', ...authHeader(url) },
    // withCredentials: true,
  }
  return axios.put(url, data, config).then(handleResponse)
}

const _delete = (url: string) => {
  const config: AxiosRequestConfig = {
    // method: 'delete',
    headers: { 'Accept': 'application/json', ...authHeader(url) },
    // withCredentials: true,
  }
  return axios.delete(url, config).then(handleResponse)
}

const authHeader = (url: string) : AxiosRequestHeaders => {
    // return auth header with jwt if user is logged in and request is to the api url
    const user = userService.userValue;
    const isLoggedIn = user && user.access_token;
    const isApiUrl = url.startsWith(publicRuntimeConfig.apiUrl);
    if (isLoggedIn && isApiUrl) {
        return { Authorization: `Bearer ${user.access_token}` };
    } else {
        return {};
    }
}

const handleResponse = (response: AxiosResponse<any, any>) => {
  const data = response.data
  if (![200, 201].includes(response.status)) {
    if (response.status == 401) {
      userService.logout()
    }
    const error = data.message || response.statusText
    //console.log(data)
    return Promise.reject(error)
  }
  return data
}

export const fetchWrapper = {
    get,
    post,
    put,
    delete: _delete
};