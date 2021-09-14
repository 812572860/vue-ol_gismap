<template>
  <div style="display:none;">
    <slot></slot>
  </div>
</template>

<script>
import Feature from 'ol/Feature.js'
import _ from 'lodash'
export default {
  name: 'OMarker',
  inject: {
    mapCtx: {
      default() {
        return null
      }
    },
    vectorCtx: {
      default() {
        return null
      }
    }
  },
  props: {
    coords: {
      type: Array
    },
    guid: {
      type: [String, Number],
      default: ""
    },
    properties: {
      type: [Object, String]
    },
    /**
     * change事件防抖wait参数
     */
    changingTimeout: {
      type: Number,
      default() {
        return 500
      }
    }
  },
  data() {
    return {
      feature: null
    }
  },
  computed: {
    map() {
      return this.mapCtx && this.mapCtx.map
    },
    vectorSource() {
      return this.vectorCtx && this.vectorCtx.source
    }
  },
  watch: {
    vectorSource(val) {
      if (val) {
        this.addFeature()
      }
    },
    coords(coords) {
      if (this.feature && coords) {
        let geometry = this.feature.getGeometry()
        let prevCoords = geometry.getCoordinates()
        // 比较两个数组是否一样，如果一样则跳过
        if (prevCoords && !_.isEqualWith(prevCoords, coords)) {
          geometry.setCoordinates(coords)
        }
      }
    }
  },
  mounted() {
    this.addFeature()
  },
  destroyed() {
    if (this.vectorSource) {
      this.vectorSource.removeFeature(this.feature)
    }
  },
  methods: {
    addFeature() {
      if (this.vectorSource && !this.feature) {
        let feature = (this.feature = new Feature())
        this.guid && feature.setId(this.guid);
        this.properties && feature.setProperties(this.properties);
        this.vectorSource.addFeature(feature)
      }
    },
    registChangeEvent(feature) {
      feature.on(
        'change',
        _.debounce((evt) => {
          this.$emit('change', evt)
        }, this.changingTimeout)
      )
    }
  }
}
</script>
