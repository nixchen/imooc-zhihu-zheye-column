import { createStore, Commit } from 'vuex'
import { currentUser, ColumnProps, PostProps, UserProps } from './testData'
import axios from './libs/http'
import { StorageHandler, storageType } from './libs/storage'
const storageHandler = new StorageHandler()

export interface GlobalErrorProps {
  status: boolean;
  message?: string;
}

export interface GlobalDataProps {
  token: string;
  error: GlobalErrorProps;
  loading: boolean;
  columns: ColumnProps[];
  posts: PostProps[];
  user: UserProps;
}

const getAndCommit = async (url: string, mutationName: string, commit: Commit) => {
  const { data } = await axios.get(url)
  commit(mutationName, data)
  return data
}
const postAndCommit = async (url: string, mutationName: string, commit: Commit, payload: any) => {
  const { data } = await axios.post(url, payload)
  commit(mutationName, data)
  return data
}
const store = createStore<GlobalDataProps>({
  state: {
    error: { status: false },
    token: storageHandler.getItem(storageType, 'token') || '',
    loading: false,
    columns: [],
    posts: [],
    user: currentUser
  },
  mutations: {
    // login (state) {
    //   state.user = { ...state.user, isLogin: true, name: 'marlon' }
    // },
    createPost (state, newPost) {
      state.posts.push(newPost)
    },
    fetchColumns (state, rawData) {
      console.log(rawData.data.list)
      state.columns = rawData.data.list
    },
    fetchColumn (state, rawData) {
      console.log(rawData.data)
      state.columns = [rawData.data]
    },
    fetchPosts (state, rawData) {
      console.log(rawData.data.list)
      state.posts = rawData.data.list
    },
    fetchPost (state, rawData) {
      // 更新替换对应post的数据
      const targetId = rawData.data._id
      const oldIndex = state.posts.findIndex(c => c._id === targetId)
      const newPost = rawData.data
      state.posts.splice(oldIndex, 1, newPost)
    },
    setLoading (state, status) {
      state.loading = status
    },
    setError (state, e: GlobalErrorProps) {
      state.error = e
    },
    login (state, rawData) {
      const { token } = rawData.data
      state.token = token
      storageHandler.setItem(storageType, 'token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    },
    fetchCurrentUser (state, rawData) {
      console.log(rawData.data)
      state.user = { isLogin: true, ...rawData.data }
    },
    logout (state) {
      state.token = ''
      state.user = { isLogin: false }
      storageHandler.remove(storageType, 'token')
      delete axios.defaults.headers.common.Authorization
    }
  },
  actions: {
    // async fetchColumns ({ commit }) {
    //   const { data } = await axios.get('/api/columns')
    //   commit('fetchColumns', data)
    // },
    // 一步封装优化实现
    fetchColumns ({ commit }) {
      return getAndCommit('/api/columns', 'fetchColumns', commit)
    },
    // async fetchColumn ({ commit }, cid) {
    //   const { data } = await axios.get(`/api/columns/${cid}`)
    //   commit('fetchColumn', data)
    // },
    fetchColumn ({ commit }, cid) {
      return getAndCommit(`/api/columns/${cid}`, 'fetchColumn', commit)
    },
    // async fetchPosts ({ commit }, cid) {
    //   const { data } = await axios.get(`/api/columns/${cid}/posts`)
    //   commit('fetchPosts', data)
    // }
    fetchPosts ({ commit }, cid) {
      return getAndCommit(`/api/columns/${cid}/posts`, 'fetchPosts', commit)
    },
    fetchPost ({ commit }, id) {
      return getAndCommit(`/api/posts/${id}`, 'fetchPost', commit)
    },
    login ({ commit }, payload) {
      return postAndCommit('/api/user/login', 'login', commit, payload)
    },
    fetchCurrentUser ({ commit }) {
      return getAndCommit('/api/user/current', 'fetchCurrentUser', commit)
    },
    // 登录并获取用户信息
    loginAndFetch ({ dispatch }, loginData) {
      return dispatch('login', loginData).then(() => {
        return dispatch('fetchCurrentUser')
      })
    },
    register ({ commit }, payload) {
      return postAndCommit('/api/users', 'register', commit, payload)
    },
    createPost ({ commit }, payload) {
      return postAndCommit('/api/posts', 'createPost', commit, payload)
    }
  },
  getters: {
    getColumnById: (state) => (id: string) => {
      return state.columns.find(c => c._id === id)
    },
    getPostsByCid: (state) => (cid: string) => {
      return state.posts.filter(post => post.column === cid)
    },
    getCurrentPost: (state) => (id: string) => {
      return state.posts.find(c => c._id === id)
    }
  }
})

export default store
