<template>
  <div class="lottie-marker" :style="style">
    <div v-if="highlight" class='water-ripple' style="width:45px;height:22px">
      <div class="water1" :style="waterDivStyle"></div>
      <div class="water2" :style="waterDivStyle"></div>
      <div class="water3" :style="waterDivStyle"></div>
      <div class="water4" :style="waterDivStyle"></div>
    </div>
    <div ref="lavContainer" class="lottie" @click="onClick"></div>
  </div>

</template>

<script>
import lottie from 'lottie-web'
// import * as svgSource from '@/api/svgSource'
export default {
  props: {
    name: {
      type: String
    },
    animationData: {
      type: Object
    },
    path: {
      type: String
    },
    segment: {
      type: Array
    },
    height: Number,
    width: Number,
    highlight: Boolean
  },
  data () {
    return {
      isPlayBySegment: false,
    }
  },
  computed: {
    style () {
      let style = {
        width: this.width ? `${this.width}px` : '100%',
        height: this.height ? `${this.height}px` : '100%',

      }
      if (this.highlight) {
        style.transform = 'scale(1.6)'
        style.transformOrigin = '50% 100%'
        style.zIndex = 1000
      }
      return style
    },
    waterDivStyle() {
      return {
        'box-shadow': '0 0 120px 30px #FF7F0F inset'
      }
    }
  },
  watch: {
    segment (value) {
      value && this.playBySegment(value)
    },
    isPlayBySegment (value) {
      value && this.playBySegment(this.segment)
    }
  },
  methods: {
    init () {
      const baseUrl = this.$store.state.app.systemSettings.basePath
      this.anim = lottie.destroy()
      this.$nextTick(() => {
        let anim = {
          container: this.$refs.lavContainer,
          name: this.name,
          renderer: 'svg',
          loop: false, // !this.data.loop,
          autoplay: false // !this.data.autoplay,
          // rendererSettings: this.data.rendererSettings
        }
        if (this.path) {
          anim.path = this.path
        }
        if (this.animationData) {
          anim.animationData = this.animationData
        }
        const self = this
        this.anim = lottie.loadAnimation(anim)

        if (this.segment) {
          this.anim.addEventListener('data_ready', () => {
            console.log('animation data has loaded')
            self.isPlayBySegment = true
          })
        } else {
          this.playAnimate()
        }
      })
    },
    playBySegment (segment) {
      if (this.anim && segment && this.isPlayBySegment) {
        this.anim.playSegments(segment, true)
        this.anim.onComplete = () => {
          this.anim.playSegments(segment, true)
        }
      }
    },
    playAnimate () {
      this.anim.play()
    },
    stopAnimate () {
      this.anim.stop()
    },
    setAnimateSpeed (speed = 1) {
      this.anim.setSpeed(speed)
    },
    onClick (e) {
      this.$emit('click', e)
    }
  },
  mounted () {
    this.init()
  },
  beforeDestroy () {
    this.anim = lottie.destroy()
  }
}
</script>

<style lang="scss" scoped>
.lottie-marker {
  // overflow: hidden;
  margin: 0 auto;
  cursor: pointer;
  position: relative;
}
.water-ripple {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);

  .water1,
  .water2,
  .water3,
  .water4 {
    width: 50%;
    height: 50%;
    position: absolute;
    left: 25%;
    top: 25%;
    transform: translateX(-25%) translateY(-25%);
    border-radius: 100%;
    z-index: 1;
    opacity: 0;
  }
  .water1 {
    -webkit-animation: wateranimate 6s 6s ease-out infinite;
    animation: wateranimate 6s 6s ease-out infinite;
  }
  .water2 {
    -webkit-animation: wateranimate 6s 4s ease-out infinite;
    animation: wateranimate 6s 4s ease-out infinite;
  }
  .water3 {
    -webkit-animation: wateranimate 6s 2s ease-out infinite;
    animation: wateranimate 6s 2s ease-out infinite;
  }
  .water4 {
    -webkit-animation: wateranimate 6s 0s ease-out infinite;
    animation: wateranimate 6s 0s ease-out infinite;
  }
}
// 水波纹效果
@keyframes wateranimate {
  0% {
    -webkit-transform: scale(0);
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    -webkit-transform: scale(2);
    transform: scale(2);
    opacity: 0;
  }
}	
</style>
