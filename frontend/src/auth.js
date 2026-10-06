import axios from 'axios'

const TOKEN_KEY = 'medref_token'

function safeGetItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore restricted or unavailable storage environments.
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore restricted or unavailable storage environments.
  }
}

export function setToken(token){
  if (!token) {
    safeRemoveItem(TOKEN_KEY)
    delete axios.defaults.headers.common['Authorization']
    return
  }

  safeSetItem(TOKEN_KEY, token)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function getToken(){
  return safeGetItem(TOKEN_KEY)
}

export function removeToken(){
  safeRemoveItem(TOKEN_KEY)
  delete axios.defaults.headers.common['Authorization']
}

export function initAuth(){
  const t = getToken()
  if(t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
  return t
}
