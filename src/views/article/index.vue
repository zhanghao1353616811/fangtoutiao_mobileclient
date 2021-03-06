<template>
  <div class="article-container">
    <!-- 导航栏 -->
    <van-nav-bar @click-left="$router.back()" title="文章详情" left-arrow fixed />
    <!-- /导航栏 -->

    <van-row class="article-box">
      <!-- 加载中 -->
      <van-loading v-if="loading" class="article-loading" color="#1989fa" vertical>
        <slot>加载中...</slot>
      </van-loading>
      <!-- /加载中 -->

      <!-- 文章详情 -->
      <van-row v-else-if="ArticleDetails.title" class="article-details">
        <h3 class="article-title">{{ArticleDetails.title}}</h3>
        <van-row class="article-author" type="flex" justify="space-between" align="center">
          <van-col class="author-info">
            <van-image :src="ArticleDetails.aut_photo" class="avatar" round fit="cover"/>
            <van-row class="info-text">
              <van-col class="info-name">{{ArticleDetails.aut_name}}</van-col>
              <van-col class="info-time">{{ArticleDetails.pubdate|relativeTime}}</van-col>
            </van-row>
          </van-col>

          <!-- v-if=如果用户没登录||文章作者不是当前登录用户 !$store.state.user=!user -->
          <van-button v-if="!user||ArticleDetails.aut_id !==$store.state.user.id"
            @click="clickFollowOrCancel" :loading="isFollowLoadingShow" loading-type="spinner"
            :type="ArticleDetails.is_followed?'default':'info'" :icon="ArticleDetails.is_followed?'':'plus'"
            class="follow-btn" round size="mini">{{ArticleDetails.is_followed?'已关注':'关注'}}
          </van-button>
        </van-row>

        <!--文章内容 -->
        <Van-row v-html="ArticleDetails.content" class="markdown-body" />
        <!-- /文章内容 -->

         <van-cell title="全部评论" class="comment-list-title"/>
        <!-- 文章评论 -->
        <article-comment @click-reply="onClickReplyComment" ref="article-comment" :article-id="articleId"/>
        <!-- /文章评论 -->
      </van-row>
      <!-- /文章详情 -->

      <!-- 加载失败提示 -->
      <van-row v-else class="article-error">
        <img src="../../assets/images/no-network.png" alt="no-network"/>
        <p class="error-text">网络不给力哦</p>
        <van-button @click="loadArticleDetails"
          class="error-btn" round type="default" size="small" color="#ccc">点击重试
        </van-button>
      </van-row>
      <!-- /加载失败提示 -->
    </van-row>

    <!-- 底部区域 -->
    <van-row class="article-footer">
      <van-button @click="isPostCommentShow=true"
        class="write-btn" type="default" round size="small">写评论</van-button>
      <van-icon class="comment-icon" name="comment-o" :info="totalCount"></van-icon>
      <van-icon @click="clickCollectOrCancel"
        :name="ArticleDetails.is_collected?'star':'star-o'" color="orange" />
      <van-icon @click="clickLikeOrCancel"
        :name="ArticleDetails.attitude===1?'good-job':'good-job-o'" color="#e5645f" />
      <van-icon @click="onShare" class="share-icon" name="share" />
    </van-row>
    <!-- /底部区域 -->

    <!-- 发布文章评论 -->
    <van-popup v-model="isPostCommentShow" position="bottom" :style="{height:'18%'}">
      <!-- 在组件上使用 v-model 本质父子通信 相当于 :value="postMessage"
       @input="postMessage=事件参数" 子组件通过$event事件参数传给父组件 事件参数赋值给 postMessage
      --><!--父组件没有list  list在子组件中 通过ref获取子组件list-->
      <post-comment v-model="postMessage" @click-post="onPostComment"/>
    </van-popup>
    <!-- /发布文章评论 -->

    <!-- 评论回复 -->
    <van-popup v-model="isReplyShow" position="bottom" :style="{height:'90%'}">
      <!-- v-if="isReplyShow" 如果初始的条件是 false，则弹层的内容不会渲染
      程序运行期间，当条件变为 true 的时候，弹层才渲染了内容
      之后切换弹层的展示，弹层只是通过 CSS 控制隐藏和显示 -->
      <comment-reply v-if="isReplyShow" :article-id="articleId" :comment="currentComment"
      @click-close="isReplyShow=false"/>
    </van-popup>
    <!-- /评论回复 -->
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getArticleDetails, addCollect, deleteCollect, addLike, deleteLike } from '@/api/article'
import { addComments, getComments } from '@/api/comment'
import { addFollow, deleteFollow } from '@/api/user'
import articleComment from './components/article-comment'
import postComment from './components/post-comment'
import commentReply from './components/comment-reply'

export default {
  name: 'ArticlePage',
  inject: ['reload'],
  components: {
    postComment,
    articleComment,
    commentReply
  },
  props: {
    articleId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      loading: true, // 文章加载中的 loading 状态
      ArticleDetails: {}, // 文章详情
      isFollowLoadingShow: false, // 关注按钮的 loading 状态
      isPostCommentShow: false, // 发布评论的弹层显示状态
      postMessage: '', // 发布评论内容
      isReplyShow: false, // 展示评论回复弹层
      currentComment: {}, // 点击回复的那个评论项
      totalCount: ''// 文章评论总数
    }
  },
  methods: {
    onShare () {
      // 第一个参数:要发送的分享消息对象
      // 第二个参数:分享操作成功回调
      // 第三个参数:分享操作失败回调
      window.plus.share.sendWithSystem({
        content: this.ArticleDetails.title,
        href: `http://www.mingjue.xyz/#${this.$route.fullPath}`
      }, () => {
        console.log('分享成功')
      }, () => {
        console.log('分享失败')
      })
    },
    onClickReplyComment (comment) {
      // console.log(comment) comment点击回复所在评论对象
      // 将点击回复所在的评论对象记录起来
      this.currentComment = comment
      this.isReplyShow = true
    },
    // 获取文章评论总数
    async onLoadComment () {
      const { data } = await getComments({
        type: 'a', // a-对文章(article)的评论 c-对评论(comment)的回复
        source: this.articleId, // 源id 文章id或评论id
        offset: this.offset, // 获取评论数据的偏移量 值为评论id 表示从此id的数据向后取 不传表示从第一页开始读取数据
        limit: this.limit // 获取的评论数据个数 不传表示采用后端服务设定的默认每页数据量
      })
      // console.log(data)
      this.totalCount = data.data.total_count
      this.isRouterAlive = false
    },
    // 发布评论
    async onPostComment () {
      this.$toast.loading({
        duration: 0, // 持续展示 toast
        message: '发布中...',
        forbidClick: true // 是否禁止背景点击
      })
      try {
        const { data } = await addComments({
          target: this.articleId, // 评论的目标id（评论文章即为文章id 对评论进行回复则为评论id）
          content: this.postMessage // 评论内容
        // art_id 文章id 对评论内容发表回复时 需要传递此参数 表明所属文章id 对文章进行评论 不要传此参数
        })
        // console.log(data)
        // 将数据添加到列表中
        // this.$refs['post-comment'] 没法直接点 因为有特殊符号
        this.$refs['article-comment'].list.unshift(data.data.new_obj)
        this.$toast.success('发布成功')
        this.totalCount++ // 实时更新文章总评论数
        // 清空文本框
        this.postMessage = ''
        // 关闭弹层
        this.isPostCommentShow = false
      } catch (error) {
        // console.log(error)
        this.$toast.fail('发布失败')
        this.postMessage = ''
      }
    },
    // 关注用户
    async clickFollowOrCancel () {
      // 开启按钮的loading状态
      this.isFollowLoadingShow = true
      try {
        const authorId = this.ArticleDetails.aut_id
        // 如果已关注 则取消关注
        if (this.ArticleDetails.is_followed) {
          await deleteFollow(authorId)
        } else {
        // 否则添加关注
          await addFollow(authorId)
        }
        // 更新视图
        this.ArticleDetails.is_followed = !this.ArticleDetails.is_followed
      } catch (error) {
        // console.log(error)
        this.$toast.fail('操作失败')
      }
      // 关闭按钮的 loading 状态
      this.isFollowLoadingShow = false
    },
    // 点赞文章
    async clickLikeOrCancel () {
      // 两个作用：1、交互提示 2、防止网络慢用户连续不断的点击按钮请求
      this.$toast.loading({
        duration: 0, // 持续展示toast
        message: '加载中...', // 文本提示内容
        forbidClick: true //  是否禁止背景点击
      })
      try {
        // 如果已点赞 则取消点赞
        if (this.ArticleDetails.attitude === 1) {
          await deleteLike(this.articleId)
          this.ArticleDetails.attitude = -1
          this.$toast.success('取消点赞')
        } else {
        // 否则添加点赞
          await addLike(this.articleId)
          this.ArticleDetails.attitude = 1
          this.$toast.success('点赞成功')
        }
      } catch (error) {
        // console.log(error)
        this.$toast.fail('操作失败')
      }
    },
    // 收藏文章
    async clickCollectOrCancel () {
      this.$toast.loading({
        duration: 0,
        message: '加载中...',
        forbidClick: true
      })
      try {
        // 如果已收藏 则取消收藏
        if (this.ArticleDetails.is_collected) {
          await deleteCollect(this.articleId)
          this.ArticleDetails.is_collected = false
          this.$toast.success('取消收藏')
        } else {
        // 添加收藏
          await addCollect(this.articleId)
          this.ArticleDetails.is_collected = true
          this.$toast.success('收藏成功')
        }
      } catch (error) {
        // console.log(error)
        this.$toast.fail('操作失败')
      }
    },
    // 加载文章详情数据
    async loadArticleDetails () {
      this.loading = true
      try {
        // 第一种方式获取id: this.$route.params.articleId
        // 第二种方式获取id：props:true 将动态路由参数映射到组件props中 在通过this.articleId调用
        const { data } = await getArticleDetails(this.articleId)
        // JSON.parse('abcdefg')  用json.parse测试数据加载失败
        // console.log(data)
        this.ArticleDetails = data.data
      } catch (error) {
        // console.log(error)
        this.$toast.fail('加载数据失败')
      }
      this.loading = false
    }
  },
  computed: {
    ...mapState(['user'])
  },
  created () {
    this.onLoadComment()
    this.loadArticleDetails()
  }
}
</script>

<style scoped lang="less">
@import "./github-markdown.css";

.article-container {
  background: #fff;
  .article-box {
    padding: 46px 20px 80px;
    .article-loading {
      margin-top: 100px;
      text-align: center;
    }
    .article-title {
      margin: 0;
      padding-top: 24px;
      font-size: 20px;
      color: #3a3a3a;
    }
    .article-author {
      padding: 20px 0;
      height: 40px;
      .author-info {
        display: flex;
        align-items: center;
        .avatar {
          width: 40px;
          height: 40px;
          margin-right: 8px;
        }
        .info-text {
          display: flex;
          flex-direction: column;
          .info-name {
            margin: 0;
            font-size: 14px;
          }
          .info-time {
            margin: 0;
            font-size: 12px;
            color: #999;
          }
        }
      }
      .follow-btn {
        width: 100px;
        height: 30px;
      }
    }
    .comment-list-title{
      padding: 20px 0 20px;
      color: #333;
     }
    .article-error {
      padding-top: 100px;
      text-align: center;
      background-color: #fff;
      .error-text {
        font-size: 15px;
      }
      .error-btn {
        width: 30%;
      }
    }
  }
  .article-footer {
    height: 44px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #d8d8d8;
    background-color: #fff;
    .write-btn {
      width: 160px;
      height: 30px;
    }
    .van-icon {
      font-size: 20px;
    }
    .comment-icon {
      bottom: -2px;
    }
    .share-icon {
      bottom: -2px;
    }
  }
}
</style>
