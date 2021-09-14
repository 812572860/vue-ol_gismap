<template>
  <div class="map">
    <div class="mouse-position" ref="mousePosition"></div>
    <slot />
  </div>
</template>
<script>
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import Feature from 'ol/Feature.js'
import Overlay from 'ol/Overlay'

import { getCenter, boundingExtent } from 'ol/extent.js'
import {
  Projection,
  addProjection,
  addCoordinateTransforms,
  get as getProj,
} from 'ol/proj'
import TileGrid from 'ol/tilegrid/TileGrid'
import XYZ from 'ol/source/XYZ'

import { defaults as defaultControls, Zoom } from 'ol/control'
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from 'ol/interaction.js'
import MousePosition from 'ol/control/MousePosition'
import ScaleLine from 'ol/control/ScaleLine'
import { createStringXY } from 'ol/coordinate'
import proj4 from 'proj4'
import Tile from 'ol/layer/Tile'
import _ from 'lodash'

export default {
  props: {
    // 地图原点
    origin: {
      type: Array,
      // default: () => [37385522.863254, 4288994.109781]
    },
    coordinateSystem: {
      type: String,
      default: 'wgs84'
    },
    // 地图展示的坐标系编码
    projectionCode: {
      type: String,
      default: 'EPSG:3857',
    },
    extent: {
      type: Array,
      default: () => null,
    },
    initialZoom: {
      type: Number,
    },
    // 当前中心点 {type: '', coord: []},type——point、extent
    center: {
      type: Object,
      default() {
        return null
      },
    },
    // 旋转角度
    rotation: {
      type: Number,
      default: 0,
    },
    // 分辨率
    resolutions: {
      type: Array,
      default: () => [
        122123.52,
        61061.76,
        30530.88,
        15265.44,
        7632.72,
        3816.36,
        1908.18,
        959.28341345489,
        479.641706727445,
        239.820853363723,
        119.910426681861,
        59.4246362317189,
        29.844372863041,
        14.9221864315205,
        7.44454977182287,
        3.73054660788013,
        1.86010634187929,
        0.930053170939644,
        0.470006572001416,
        0.240000854004226,
        0.12000043,
        0.06,
        0.03,
        0.015,
      ],
    },
    showMousePosition: {
      type: Boolean,
      default: true,
    },
    showDefaultZoomBtn: {
      type: Boolean,
      default: false,
    },
    showScaleLine: {
      type: Boolean,
      default: true,
    },
    activeSelectorOnMouseMove: {
      type: Boolean,
      default: true,
    }
  },
  data() {
    return {
      map: null,
      mapView: null,
      dispatchedEvents: {},
      projection: null
    }
  },
  mounted() {
    this.initMap()
  },
  provide() {
    return {
      mapCtx: this,
    }
  },
  watch: {
    center(value, preValue) {
      if (this.mapView && value && value.coord) {
        if (preValue && preValue.coord && preValue.coord === value.coord) {
          return
        }
        let centerPoint
        if (value.type === 'point') {
          centerPoint = value.coord
        } else if (value.type === 'extent') {
          centerPoint = getCenter(boundingExtent(value.coord))
        }
        centerPoint &&
          this.mapView.animate({
            center: centerPoint,
            duration: 500,
          })
      }
    },
    extent(value) {
      if (this.map && value && value.length) {
        this.map.getView().fit(value, {
          nearest: true,
        })
      }
    },
    rotation(value) {
      if (this.map && this.mapView) {
        this.mapView.setRotation(value)
      }
    },
  },
  methods: {
    initMap() {
      let defcenter
      if (this.center) {
        if (this.center.type === 'point') {
          defcenter = this.center.coord
        } else if (this.center.type === 'extent') {
          defcenter = getCenter(this.center.coord)
        }
      }
      this.projection = this.origin && this.addProjectionByDefs(this.origin)
      this.mapView = new View({
        projection: this.projection || this.projectionCode,
        rotation: this.rotation,
      })
      if (defcenter) {
        this.mapView.setCenter(defcenter)
      }
      if (this.initialZoom) {
        this.mapView.setZoom(this.initialZoom)
      }
      if (this.resolutions) {
        this.mapView.setResolution(this.resolutions)
      }

      this.map = new Map({
        controls: this.getControls(),
        interactions: defaultInteractions(),
        // .extend([
        //   new DragRotateAndZoom()
        // ]),
        target: this.$el,
        layers: [],
        view: this.mapView,
      })
      if (this.extent) {
        this.resetMapExtent(this.extent)
      }

      this.$nextTick(() => {
        this.dispatchEvent('click')
        this.dispatchEvent('singleclick')
        this.dispatchEvent('dblclick')
        this.dispatchEvent('pointermove', this.activeSelectorOnMouseMove)
        this.dispatchEvent('pointerdrag')
      })
      this.$emit('mapReady', this.map)
    },
    // 根据metadata信息，添加相关的投影，用于后面坐标转换
    addProjectionByDefs(originCoord) {
      var epsgDefs = this.getEpsgDefsByCoord(originCoord, this.coordinateSystem)
      proj4.defs(epsgDefs.code, epsgDefs.def)
      var projection = new Projection({
        code: epsgDefs.code,
        extent: [33900000, 1800000, 39570000, 6000000],
        units: 'm',
        axisOrientation: 'neu',
      })
      // 结合proj4在ol3中自定义坐标系
      addProjection(projection)
      addCoordinateTransforms(
        'EPSG:4326',
        epsgDefs.code,
        function(coordinate) {
          return proj4('EPSG:4326', epsgDefs.code, coordinate)
        },
        function(coordinate) {
          return proj4(epsgDefs.code, 'EPSG:4326', coordinate)
        }
      )
      addCoordinateTransforms(
        'EPSG:3857',
        epsgDefs.code,
        function(coordinate) {
          return proj4('EPSG:3857', epsgDefs.code, coordinate)
        },
        function(coordinate) {
          return proj4(epsgDefs.code, 'EPSG:3857', coordinate)
        }
      )
      return getProj(epsgDefs.code)
    },
    getEpsgDefsByCoord(originPoint, coordinateSystem = 'wgs84') {
      var x = originPoint
      if (typeof originPoint != 'number') {
        x = originPoint[0]
      }
      // 获取原点经度前两位数字
      const code = parseInt(x / 1000000)
      // 判断是三都带还是六度带, 大于24则为3度带
      let deltaCode = 3
      if (code < 24) {
        deltaCode = 6
      }
      // 根据坐标系计算对应的epsg编码，我国经度范围西起73°，东至135°，横跨11个六度带，对应带号是13-23度带，三度带比6度带大一倍，基本上就是24-45度带
      // 25——中国起始三都带为25，起始六度带为13
      let epsgCode = '',
        ellpsCode = ''
      switch (coordinateSystem) {
        case 'beijing54':
          epsgCode = deltaCode === 3 ? code - 25 + 2401 : code - 13 + 21413
          ellpsCode = 'krass'
          break
        case 'xian80':
          epsgCode = deltaCode === 3 ? code - 25 + 2349 : code - 13 + 2327
          ellpsCode = 'GRS80'
          break
        default:
          epsgCode = deltaCode === 3 ? code - 25 + 4513 : code - 13 + 4491
          ellpsCode = 'WGS84'
          break
      }
      // 相对起始带号
      const startCode = deltaCode === 3 ? code - 25 : code - 13
      // 经纬度转换
      const lon_0 = 75 + startCode * deltaCode
      const x_0 = code * 1000000 + 500000

      let def = `+proj=tmerc +lat_0=0 +lon_0=${lon_0} +k=1.000000 +x_0=${x_0} +y_0=0 +ellps=${ellpsCode} +units=m +no_defs`

      return {
        code: 'EPSG:' + epsgCode,
        def,
      }
    },
    getControls() {
      // const defaultControlList = defaultControls({
      //   zoom: this.showDefaultZoomBtn,
      //   attribution: false
      // })
      let extendControls = []
      if (this.showScaleLine) {
        const scaleLine = new ScaleLine()
        extendControls.push(scaleLine)
      }
      if (this.showDefaultZoomBtn) {
        extendControls.push(new Zoom())
      }

      if (this.showMousePosition) {
        // 坐标
        const mousePositionControl = new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: 'xkcd-image',
          // comment the following two lines to have the mouse position
          // be placed within the map.
          className: 'custom-mouse-position',
          target: this.$refs.mousePosition,
          undefinedHTML: '&nbsp;',
        })
        extendControls.push(mousePositionControl)
      }
      return extendControls // defaultControlList.extend(extendControls)
    },
    dispatchEvent(eventName, activeNoFeature = true) {
      const self = this
      const eventList = [
        'click',
        'singleclick',
        'dblclick',
        'pointermove',
        'pointerdrag',
      ]
      if (this.map && !this.dispatchedEvents[eventName]) {
        this.dispatchedEvents[eventName] = 1
        self.map.on(eventName, (event) => {
          let emited = false
          // try {
          self.map.forEachFeatureAtPixel(
            event.pixel,
            (feature) => {
              const hasTriggerEvent =
                feature.listeners_ &&
                Object.keys(feature.listeners_).filter(
                  (key) => eventList.indexOf(key) > -1
                ).length > 0
              if (!emited && hasTriggerEvent) {
                // 当前地图唯一选择元素
                self.$emit('activedFeature', feature)
                // 为feature发送自定义的事件消息
                feature.dispatchEvent({ type: eventName, event: event })
                emited = true
              }
            },
            { hitTolerance: 5 }
          )
          // } catch (error) {
          //   console.log(error)
          // }
          activeNoFeature && !emited && self.$emit('noFeature', eventName)
        })
      }
    },
    
    addTileLayer({ url, tileUrlFunction, zIndex = 0, extent, tileGridConfig }) {
      let source = {
        // projection: this.projectionCode,
        zIndex,
      }
      // 配置切片地址
      if (url) {
        source.url = url
      } else if (tileUrlFunction) {
        source.tileUrlFunction = tileUrlFunction
      }

      if (extent) {
        source.extent = extent
      }
      // 配置切片大小
      if (tileGridConfig && tileGridConfig instanceof Object) {
        source.tileGrid = new TileGrid(tileGridConfig)
      }

      const tileLayer = new Tile({
        source: new XYZ(source),
      })

      this.map.addLayer(tileLayer)
    },
    getPixelFromCoordinate(coord) {
      return this.map && this.map.getPixelFromCoordinate(coord)
    },
    getCoordinateFromPixel(pixel) {
      return this.map && this.map.getCoordinateFromPixel(pixel)
    },

    // 获取全部feature对象
    getAllFeatures() {
      let features = []
      const vectorLayers = this.map.getLayers()
      if (vectorLayers && vectorLayers.getArray().length) {
        vectorLayers.getArray().forEach((layer) => {
          features = features.concat(layer.getSource().getFeatures())
        })
      }
      const overlays = this.map.getOverlays()
      if (overlays && overlays.getArray().length) {
        features = features.concat(overlays.getArray())
      }
      return features
    },
    // 根据feature进行定位
    locateCurrentFeature(feature, finalZoom = 18) {
      let position = null
      if (feature instanceof Feature) {
        // this.map.getView().fit(feature.getGeometry())
        position = feature.getGeometry().getCoordinates()
      } else if (feature instanceof Overlay) {
        position = feature.getPosition()
      }
      if (position) {
        this.flyTo(position, finalZoom)
        // this.mapView.animate({center: position, duration: 2000})
      } else {
        this.$emit('showErrorMsg', '定位失败！')
      }
    },
    flyTo(location, finalZoom = 18, duration = 1500) {
      let zoom = this.mapView.getZoom()
      let parts = 2
      let called = false
      function callback(complete) {
        --parts
        if (called) {
          return
        }
        if (parts === 0 || !complete) {
          called = true
        }
      }
      this.mapView.animate(
        {
          center: location,
          duration: duration,
        },
        callback
      )
      this.mapView.animate(
        {
          zoom: zoom,
          duration: duration / 2,
        },
        {
          zoom: zoom > finalZoom ? zoom : finalZoom,
          duration: duration / 2,
        },
        callback
      )
    },
    // 根据extent重制地图当前显示范围
    resetMapExtent(extent) {
      if (this.map && extent) {
        this.mapView.fit(extent, {
          nearest: true,
        })
        this.mapView.setRotation(this.rotation)
      }
    },
  },
}
</script>
<style lang="scss" scoped>
@import './_openlayers.scss';

.map {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
