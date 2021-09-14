<template>
  <div class="map">
    <div class="mouse-position" ref="mousePosition"></div>
    <slot />
  </div>
</template>
<script>
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import { getCenter } from 'ol/extent.js'
import ImageLayer from 'ol/layer/Image.js'
import Projection from 'ol/proj/Projection.js'
import Static from 'ol/source/ImageStatic.js'
import { defaults as defaultControls } from 'ol/control'
import MousePosition from 'ol/control/MousePosition'
import { createStringXY } from 'ol/coordinate'
export default {
  props: {
    imageList: {
      type: Array
    },
    extent: {
      type: Array,
      default: () => [0, 0, 1920, 1080]
    },
    initialZoom: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      map: null
    }
  },
  mounted() {
    this.initMap()
  },
  provide() {
    return {
      mapCtx: this
    }
  },
  methods: {
    initMap() {
      var projection = new Projection({
        code: 'xkcd-image',
        // units: 'pixels',
        extent: this.extent
      })

      this.map = new Map({
        controls: this.getControls(),
        layers: [],
        target: this.$el,
        view: new View({
          projection: projection,
          center: getCenter(this.extent),
          zoom: this.initialZoom
          // maxZoom: 5
        })
      })
      this.map.once('postrender', () => {
        if (this.imageList && this.imageList.length) {
          this.imageList.forEach((item, index) => {
            const imageLayer = new ImageLayer({
              source: new Static({
                // attributions: '© <a href="###">Copyright YT</a>',
                zIndex: index + 1,
                url: item.img,
                projection: projection,
                imageExtent: item.extent,
                imageSize: this.getImageSize(this.map, item.extent)
              })
            })
            this.map.addLayer(imageLayer)
          })
        }
      })
    },
    getControls() {
      // 坐标
      var mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: 'xkcd-image',
        // comment the following two lines to have the mouse position
        // be placed within the map.
        className: 'custom-mouse-position',
        target: this.$refs.mousePosition,
        undefinedHTML: '&nbsp;'
      })
      return defaultControls({
        attributionOptions: { collapsible: false }
      }).extend([mousePositionControl])
    },
    // 解决svg格式图片失真
    getImageSize(map, bounds) {
      var _min = [bounds[0], bounds[1]],
        _max = [bounds[2], bounds[3]],
        _topLeft = [bounds[0], bounds[3]]
      var _scrMin = map.getPixelFromCoordinate(_min)
      let _scrMax = map.getPixelFromCoordinate(_max)
      var _w = Math.round(_scrMax[0] - _scrMin[0]),
        _h = Math.round(_scrMin[1] - _scrMax[1])
      return [_w, _h]
    }
  }
}
</script>
<style lang="scss" scoped>
.map {
  width: 100%;
  height: 100%;
  position: relative;
}
.mouse-position {
  position: absolute;
  left: 10px;
  bottom: 10px;
  background: #fff;
  z-index: 1;
  font-size: 12px;
}
</style>
