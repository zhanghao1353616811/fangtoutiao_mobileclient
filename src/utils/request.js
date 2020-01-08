/**
 * 基于axios的请求模块
 */

import axios from 'axios'
import jsonBig from 'json-bigint'

// axios.create 方法创建一个和 axios 本身功能一样的一个对象

const request = axios.create({
  baseURL: 'http://ttapi.research.itcast.cn/' // 基础路径
})

// axios 开放了自定义转换后端返回数据的 API
// data 就是后端返回的原始数据
request.defaults.transformResponse = [function (data) {
  // 现在我们定制使用 json-bigint 来帮我们处理转换原始的 JSON 格式字符串
  // 这个方法类似于 JSON.parse,只不过它能把数据中超出 JS 安全整数范围的数字给处理成正确的
  // 它内部有自己的算法  会把大数字转为一个对象  我们在使用的时候把对象.toString() 就得到字符串形式的 id
  // 如果转换成功 则返回成功的结果给请求使用
  // 如果转换失败 则进入 catch 返回一个空对象
  try {
    return jsonBig.parse(data)
    // 它默认是这样的 JSON.parse(data)
  } catch (error) {
    console.log('超出 JS 安全整数范围数字转换失败', error)
    return {}
  }
}]

// 请求拦截器

// 响应拦截器

export default request
