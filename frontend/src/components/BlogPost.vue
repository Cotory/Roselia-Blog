<template>
  <div id="post">
    <nav-bar :userData="userData" :route="this.$route.fullPath"></nav-bar>
    <v-parallax
      id="main-pic"
      dark
      :src="postData.img || 'static/img/nest.png'"
    >
      <v-layout
        align-center
        column
        justify-center
      >
        <h1 id="title" class="display-2 font-weight-thin mb-3">{{postData.title}}</h1>
        <h4 id="subtitle" class="subheading">{{postData.subtitle}}</h4>
        <h4 id="date" class="subheading">{{postData.date}}</h4>
      </v-layout>
    </v-parallax>
    <v-container grid-list-md fluid fill-height>
      <v-layout>
        <v-flex wrap row xs12 sm10 offset-sm2>
          <v-layout row>
            <router-link v-for="tag in postData.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
              <v-chip>{{tag}}</v-chip>
            </router-link>
          </v-layout>
          <v-flex xs10 offset xs2>
            <v-btn v-if="cachedData" color="secondary" fab small @click="$router.go(-1)">
              <v-icon>arrow_back</v-icon>
            </v-btn>
            <v-layout v-if="postData.id !== 'preview' && postData.id !== -1 && userData && userData.role  && userData.role + 1 >= postData.secret">
              <v-spacer></v-spacer>
              <v-btn color="error" fab small :to="{name: 'edit', params: {deletePost: true, title: postData.title}, query: {post: postData.id}}">
                <v-icon>delete</v-icon>
              </v-btn>
              <v-btn color="primary" fab small :to="{name: 'edit', query: {post: postData.id}}">
                <v-icon>mode_edit</v-icon>
              </v-btn>
            </v-layout>
          </v-flex>
          <v-layout>
            <v-flex :class="{sm8: hasDigest, sm10: !hasDigest}">
              <div id="content" class="flow-text responsive-img" ref="content" v-html="postData.content"></div>
            </v-flex>
            <v-flex v-if="hasDigest" sm2>
              <blog-digest-nav :items="postDigest" offset="500" threshold="500"></blog-digest-nav>
            </v-flex>

          </v-layout>

          <div v-wechat-title="postData.title"></div>
        </v-flex>


      </v-layout>

    </v-container>

    <v-container>
      <v-flex row xs12 sm10 offset-sm1>
        <v-layout>
          <v-btn color="primary" fab small v-if="postData.next !== -1" :to="{name: 'post', query: {p: postData.next}}">
            <v-icon>chevron_left</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" fab small v-if="postData.prev !== -1" :to="{name: 'post', query: {p: postData.prev}}">
            <v-icon>chevron_right</v-icon>
          </v-btn>
        </v-layout>
      </v-flex>
    </v-container>

    <v-dialog
      v-model="preview.show"
      hide-overlay
      width="300"
      :lazy="true"
      :attach="preview.attach"
      :origin="preview.origin"
    >
      <v-card
        :color="preview.color"
        dark
      >
        <v-img v-if="preview.img" :src="preview.img"/>
        <v-card-text>
          <div v-if="!preview.loading">
            <h1 class="title">
              <strong>{{preview.title}}</strong>
            </h1>
            <v-spacer></v-spacer>
            <h6 class="subheading text-truncate">{{preview.subtitle}}</h6>
          </div>
          
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
            v-if="preview.loading"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>

    <toast v-bind="toast" @showChange="changeToast"></toast>
    <blog-footer></blog-footer>

  </div>
</template>
<script>
import utils from '../common/utils'
import BlogDigestNav from './BlogDigestNav'
import M from 'materialize-css'
import RoseliaScript from '../common/roselia-script'
export default {
  components: {
    BlogDigestNav
  },
  name: 'blog-post',
  props: {
    p: Number
  },
  data: () => ({
    postData: {
      img: '',
      id: -1,
      content: '<p>Loading, please wait...</p>',
      next: -1,
      prev: -1,
      secret: 0,
      title: 'Loading...',
      subtitle: '',
      tags: [''],
      date: (new Date()).toDateString()
    },
    userData: utils.getLoginData(),
    postDigest: [],
    preview: {
      show: false,
      loading: false,
      current: 0,
      title: "",
      subtitle: "",
      attach: "",
      origin: "center center",
      img: "",
      cacheData: null,
      color: 'secondary'
    },
    cachedData: false,
    renderer: null,
    toast: utils.getToastOption()
  }),
  methods: {
    showToast: utils.showToast,
    changeToast (show) {
      this.toast.show = show
    },
    getArguments: utils.getArguments,
    loadContent (p, context) {
      p = p || this.getPostNum()
      context = context || this.$route
      if (context && context.params.data) {
        let data = context.params.data;
        
        if (data.id === 'preview' || data.id == p) { // By design here.
          this.postData = {...this.notFoundData(), ...data}
          this.cachedData = true
          this.processContent()
          return
        }
      }
      this.cachedData = false
      if (p === -1) {
        this.postData = this.notFoundData()
        return
      }
      utils.fetchJSON(utils.apiFor('post', p)).then(data => {
        if (!data) return Promise.reject(ReferenceError('NPE'))
        this.postData = data
        this.processContent()
      }).catch(_ => {
        this.postData = this.notFoundData()
      })
    },
    processContent () {
      this.postData.content = this.renderer.render(this.postData.content)
      this.$nextTick(async _ => {
          // utils.setHeimu()
          utils.colorUtils.apply({selector: '#main-pic img', text: '#title,#subtitle,#date,.digest-nav-el,#digest-nav', changeText: true})
          const postImages = this.$refs.content.querySelectorAll('img')
          Array.from(postImages).forEach(e => {
            e.classList.add('responsive-img')
          })
          M.Materialbox.init(postImages)
          this.setDigest()
          let pattern = new RegExp(`${location.host}/.*\\?p=(\\d+)`);
          Array.from(this.$refs.content.querySelectorAll('a')).filter(e => e.href && e.host === location.host).forEach(ev => {
            let link = ev.href;
            let matchResult = pattern.exec(link)
            if (matchResult) {
              let p = matchResult[1];
              const isFootNotes = ev.hash // && p === this.getPostNum()
              
              ev.addEventListener('click', e => {
                e.preventDefault()
                if(isFootNotes) {
                  this.$vuetify.goTo(document.getElementById(ev.hash.substring(1)), {offset: -200})
                  return
                }
                // e.stopImmediatePropagation()
                // console.log(this.preview);
                // console.log('data->', this.preview.current == p && !this.preview.loading && this.preview.cacheData || undefined)
                
                this.$router.push({
                  name: 'post',
                  query: {
                    p
                  },
                  params: {
                    data: this.preview.current == p && !this.preview.loading && this.preview.cacheData || undefined
                  }
                })
                
              }, true)

              ev.addEventListener('mouseover', e => {
                // this.preview.origin = `${ev.offsetHeight} ${ev.offsetTop}`
                this.preview.show = true;
                this.preview.attach = ev
                if (isFootNotes) {
                  this.preview.cacheData = null
                  this.preview.current = p
                  let dom = document.getElementById(ev.hash.substring(1))
                  this.preview.title = dom.innerText
                  this.preview.img = ''
                  if(ev.hash.indexOf('ref') !== -1) this.preview.subtitle = dom.parentElement.innerText
                  else this.preview.subtitle = ''
                  return
                }
                if (this.preview.current === p && !this.preview.loading && this.preview.cacheData) {
                  this.preview.current = p;
                  // this.preview.loading = true
                  // console.log(this.preview)
                  return
                }
                this.preview.current = p;
                this.preview.loading = true
                this.preview.img = ''
                utils.fetchJSON(utils.apiFor('post', p)).then(data => {
                  if(!data){
                    // this.preview.show = false
                    this.preview.loading = false
                    this.preview.title = 'Oops! :('
                    this.preview.subtitle = 'This is a secret'
                    this.preview.img = ''
                    return
                  }
                  this.preview.cacheData = data
                  this.preview.loading = false
                  this.preview.title = data.title
                  this.preview.subtitle = data.subtitle
                  this.preview.img = data.img
                }).catch(reason => {
                  this.preview.loading = false
                  this.preview.cacheData = null
                  this.preview.title = ':('
                  this.preview.subtitle = reason.message
                  this.preview.img = ''
                })
              });
              ev.addEventListener('mouseout', e => {
                this.preview.show = false;
              })
            }
            
            
          });
          this.renderWithMathJax()
          this.$emit('postLoaded')
        })
    },
    renderWithMathJax () {
      if(window.MathJax) window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, "output"]);
    },
    getPostNum () {
      return this.getArguments().p || -1
    },
    notFoundData () {
      return {
        img: '',
        id: -1,
        content: '<p>There might be some problem here. Please check your input</p><p>Or maybe you know why.</p>',
        next: -1,
        prev: -1,
        secret: 0,
        title: 'Page Not Found',
        subtitle: 'Please check your post-id. Or try to login.',
        tags: ['404'],
        date: (new Date()).toDateString()
      }
    },
    setDigest () {
      this.postDigest = Array.from(this.$refs.content.querySelectorAll('h1,h2,h3')).map((e, idx) => {
        e.classList.add('scrollspy')
        e.classList.add('section')
        e.id = e.id || `section-${idx}`
        return {
          hash: e.id,
          title: e.innerHTML,
          element: e
        }
      })
    }
  },
  computed: {
    hasDigest () {
      return this.postDigest.length > 0
    }
  },
  mounted () {
    this.renderer = RoseliaScript.createRenderer(this)
    this.loadContent()
    window.addEventListener('storage', e => {
      if (e.key === 'loginData') {
        this.userData = utils.getLoginData()
      }
    })
    // console.log(RoseliaScript)
    this.renderer = RoseliaScript.createRenderer(this)
    if (!window.MathJax) {
      let mathNode = document.createElement('script')
      mathNode.async = true
      mathNode.src = 'https://cdn.bootcss.com/mathjax/2.7.3/latest.js?config=TeX-MML-AM_CHTML'
      let configNode = document.createElement('script')
      configNode.type = 'text/x-mathjax-config'
      configNode.innerHTML = `MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}});`
      document.body.appendChild(configNode)
      document.body.appendChild(mathNode)
    }
  },
  beforeRouteUpdate (to, from, next) {
    if (to.query.p === from.query.p) return next()
    this.$vuetify.goTo(0)
    this.$emit('postUnload')
    this.loadContent(to.query.p, to)
    next()
  },
  destroyed () {
    this.$emit('postUnload')
  },
  watch: {
    userData () {
      if (!this.userData && this.postData.secret) {
        this.postData = this.notFoundData()
      }
      this.postData.id === -1 && this.loadContent()
    },
    'window.MathJax' () {
      this.renderWithMathJax()
    }
  }
}
</script>

<style scoped>
code, pre {
    font-family: Consolas, "Courier New", monospace;
}

#materialbox-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: #292929 !important;
  z-index: 1000;
  will-change: opacity;
}
</style>