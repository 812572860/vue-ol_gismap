/*
 * 注册全局组件
 */

import GisMap from './olMap/GisMap'
import GeoVectorLayer from './olMap/GeoVectorLayer'
import VectorLayer from './olMap/VectorLayer'
import GeoMarker from './olMap/GeoFeature.vue'
import OlMarker from './olMap/Marker'
import OverlayMarker from './olMap/Overlay'
import MapPopover from './olMap/Popover.vue'
import MeaureLayer from './olMap/MeaureLayer.vue'

const plugin = {
  GisMap,
  VectorLayer,
  GeoVectorLayer,
  GeoMarker,
  OlMarker,
  OverlayMarker,
  MapPopover,
  MeaureLayer
}

const install = function(Vue) {
  for (let k in plugin) {
    Vue.component(k, plugin[k])
  }
}

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  version: '0.0.6',
  install,
  ...plugin
}
