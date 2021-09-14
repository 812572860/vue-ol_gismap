<template>
  <div ref="popover" :class="['popover', 'el-popover el-popper', {show: isShow}]" x-placement="top">
    <slot/>
    <!-- <div x-arrow="" class="popper__arrow"></div> -->
  </div>
</template>
<style lang="scss" scoped>
@import './variables';

  .popover {
    position: relative;
    background: $--background-color;
    border-radius: 4px;
    border: 1px solid $--color-default;
    color: $--color-default;
    position: relative;
    display: none;
    padding: 6px;
    margin-bottom: 12px;

    &.show {
      display: block;
    }

    &::after {
      content: "";
      position: absolute;
      left: 52%;
      bottom: -12px;
      display: block;
      width: 0;
      height: 0;
      border-top: 12px solid $--background-color;
      border-left: 0 solid transparent;
      border-right: 15px solid transparent;
  }
    .popper__arrow {
      left: calc(49%);
      bottom: -6px;
      margin-right: 3px;
      border-top-color: $--color-default;
      border-bottom-width: 0;
    }
  }
</style>

<script>
import Overlay from 'ol/Overlay'
// import Clickoutside from "@/common/plugin/lib/clickoutside";
export default {
  // directives: { Clickoutside },
  data() {
    return {
      loaded: false,
      // popup 对象
      popup: null,
      showPop: this.isShow
    };
  },
  mounted() {
    this.init();
  },
  props: {
    /**
     * 是否显示
     */
    isShow: {
      type: Boolean,
      default: () => {
        return true
      }
    },
    /**
     * 坐标
     */
    position: {
      type: [Array]
    },
    /**
     * 布局，默认：top-left
     */
    positioning: {
      type: String,
      default: () => {
        return 'bottom-center'
      }
    },
    /**
     * 覆盖特偏移
     */
    offset: {
      type: Array,
      default: () => {
        return [0, 0];
      }
    }
  },
  inject: {
    mapCtx: {
      default() {
        return null
      }
    }
  },
  computed: {
    // map 对象
    parentMap() {
      return this.mapCtx && this.mapCtx.map
    }
  },
  watch: {
    parentMap(value, oldValue) {
      this.addToMap();
    },
    /**
     * 坐标变换时重新设置
     */
    position (value, oldValue) {
      this.addToMap()
      this.setPosition(value)
    },
    offset (value) {
      if(this.popup && value) {
        this.popup.setOffset(value)
      }
    },
    /**
     * 监视是否显示参数
     */
    isShow (value) {
      if (value) {
        this.show()
      } else {
        this.hide()
      }
    }
  },
  methods: {
    init() {
      this.addToMap()
    },
    /** 添加到地图 */
    addToMap () {
      if (this.parentMap && !this.loaded) {
        var popup = new Overlay({
          element: this.$refs.popover,
          position: this.position,
          positioning: this.positioning,
          offset: this.offset
        });
        this.parentMap.addOverlay(popup);
        this.popup = popup
        this.loaded = true
      }
    },
    /**
     * @public
     * 设置坐标
     * @param {Array} position 坐标位置
     */
    setPosition (position) {
      if (this.popup && position) {
        this.popup.setPosition(position)
        this.autoPan(position)
      }
    },
    /**
     * 根据坐标自动判断是否重置中心点
     * @param {Object} position 坐标
     */
    autoPan (position) {
      let pixel = this.parentMap.getPixelFromCoordinate(position)
      let view = this.parentMap.getView()
      // 中心点
      let center = view.getCenter()
      center = this.parentMap.getPixelFromCoordinate(center)
      if (pixel && center) {
        let x = pixel[0]
        let y = center[1]
        // 调整中心点位置，如果坐标在上半屏，则重新设置中心点
        if (pixel[1] < center[1]) {
          y = pixel[1] - 50
        }
        if (x > 50) {
          x = center[0]
        }
        let finalPosition = this.parentMap.getCoordinateFromPixel([x, y])
        view.animate({
          center: finalPosition,
          duration: 500
        });
      }
    },
    /**
     * @public
     * 显示
     */
    show () {
      this.addToMap()
    },
    /**
     * @public
     * 隐藏
    */
    hide() {
      this.removeOverlay()
    },
    clickOutside () {
      // this.removeOverlay()
    },
    removeOverlay () {
      if (this.parentMap && this.loaded && this.popup) {
        this.parentMap.removeOverlay(this.popup)
        this.loaded = false
      }
    }
  },
  beforeDestory () {
    this.removeOverlay()
  }
};
</script>

