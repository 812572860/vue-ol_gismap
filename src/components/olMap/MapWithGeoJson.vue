<template>
  <div class="map">
    <div class="mouse-position" ref="mousePosition"></div>
    <slot />
  </div>
</template>
<script>
import ol from 'ol'
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import { getCenter } from 'ol/extent.js'
import {
  addProjection,
  addCoordinateTransforms,
  get as getProjection
} from 'ol/proj'
import Projection from 'ol/proj/Projection.js'
import TileGrid from 'ol/tilegrid/TileGrid'
import XYZ from 'ol/source/XYZ'

import { defaults as defaultControls } from 'ol/control'
import MousePosition from 'ol/control/MousePosition'
import ScaleLine from 'ol/control/ScaleLine'
import { createStringXY } from 'ol/coordinate'
import proj4 from 'proj4'
import Tile from 'ol/layer/Tile'
import DragPan from 'ol/interaction/DragPan'

import _ from 'lodash'

export default {
  props: {
    // 地图范围
    extent: {
      type: Array,
      default: () => null
    },
    // 初始缩放级别
    initialZoom: {
      type: Number
    },
    // 地图中心点位置
    center: {
      type: Array,
      default() {
        return null
      }
    },
    // 旋转弧度
    rotation: {
      type: Number
    },
    // 缩放比例
    resolution: {
      type: Number,
      default: 1
    },
    // 是否显示左下角的鼠标滑动坐标
    showMousePosition: {
      type: Boolean,
      default: true
    },
    // 是否能缩放
    canZoom: {
      type: Boolean,
      default: true
    },
    // 是否能拖拽
    canDrag: {
      type: Boolean,
      default: true
    },
    changingTimeout: {
      type: Number,
      default() {
        return 500
      }
    }
  },
  provide() {
    return {
      mapCtx: this
    }
  },
  data() {
    return {
      map: null,
      mapView: null,
      dispatchedEvents: {}
    }
  },
  computed: {
    mapCenter() {
      return this.mapView && this.mapView.getCenter()
    }
  },
  mounted() {
    this.initMap()
  },
  methods: {
    getMapCenter() {
      return this.mapView && this.mapView.getCenter()
    },
    getMapZoom() {
      return this.mapView && this.mapView.getZoom()
    },
    getMapResolution() {
      return this.mapView && this.mapView.getResolution()
    },
    getPixelFromCoordinate(coord) {
      return this.map && this.map.getPixelFromCoordinate(coord)
    },
    getCoordinateFromPixel(pixel) {
      return this.map && this.map.getCoordinateFromPixel(pixel)
    },
    initMap() {
      let defcenter = this.center || getCenter(this.extent)
      this.mapView = new View({
        center: defcenter,
        zoom: this.initialZoom
      })
      if (this.resolution) {
        this.mapView.setResolution(this.resolution)
      }
      if (this.rotation) {
        this.mapView.setRotation(this.rotation)
      }
      if (!this.canZoom) {
        if (this.initialZoom) {
          this.mapView.setMinZoom(this.initialZoom)
          this.mapView.setMaxZoom(this.initialZoom)
        } else if (this.resolution) {
          this.mapView.maxResolution_ = (this.resolution)
          this.mapView.minResolution_ = (this.resolution)
        }
      }
      this.map = new Map({
        controls: this.getControls(),
        layers: [],
        target: this.$el,
        view: this.mapView
      })
      // this.mapView.fit(this.extent, { size: this.map.getSize() })
      if (!this.canDrag) {
        this.disableMove(this.map)
      }
    },
    subscribeMapEvent(map) {
      map.on('moveend', _.throttle(this.moveend, this.changingTimeout))
    },
    getControls() {
      if (this.showMousePosition) {
        // 坐标
        const mousePositionControl = new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: 'xkcd-image',
          // comment the following two lines to have the mouse position
          // be placed within the map.
          className: 'custom-mouse-position',
          target: this.$refs.mousePosition,
          undefinedHTML: '&nbsp;'
        })
        const scaleLine = new ScaleLine()
        return defaultControls({
          attributionOptions: { collapsible: false }
        }).extend([mousePositionControl, scaleLine])
      } else {
        return defaultControls()
      }
    },
    disableMove(map) {
      map.getInteractions().forEach((element, index, array) => {
        if (element instanceof DragPan) {
          element.setActive(false)
        }
      })
    },
    dispatchEvent(eventName) {
      let map = this.map
      if (map && !this.dispatchedEvents[eventName]) {
        this.dispatchedEvents[eventName] = 1
        map.on(eventName, event => {
          let emited = false
          map.forEachFeatureAtPixel(event.pixel, feature => {
            if (!emited) {
              // 为feature发送自定义的事件消息
              feature.dispatchEvent({ type: eventName, event: event })
              emited = true
            }
          })
        })
      }
    },
    moveend(evt) {
      this.$emit('moveend', evt)
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
