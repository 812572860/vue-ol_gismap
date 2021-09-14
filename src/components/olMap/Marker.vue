<template>
  <div style="display:none;">
    <slot></slot>
  </div>
</template>

<script>
import Feature from 'ol/Feature.js'
import Point from 'ol/geom/Point.js'
import {
  Style,
  Fill,
  Circle as CircleStyle,
  Icon,
  Stroke,
  RegularShape,
  Text,
} from 'ol/style.js'
import _ from 'lodash'
export default {
  name: 'OMarker',
  inject: {
    mapCtx: {
      default() {
        return null
      },
    },
    vectorCtx: {
      default() {
        return null
      },
    },
  },
  props: {
    guid: {
      type: [String, Number],
      default: '',
    },
    properties: {
      type: [Object, String],
    },
    position: {
      type: Array,
    },
    markIcon: {
      type: Object,
    },
    markStyle: {
      type: Object,
      default: () => ({
        type: 'circle',
        size: 6,
        stokeColor: '#ffcc33',
      }),
    },
    fillColor: {
      type: [String, Object, CanvasPattern],
      default: '#ffcc33',
    },
    // 标记显示的信息
    showLabel: {
      type: String,
      default: '',
    },
    // 标记配置
    markLabelConfig: {
      type: Object,
      default: () => ({
        fontSize: 10,
        fontColor: '#4AF3F3',
        showZoom: 18,
      }),
    },
    changingTimeout: {
      type: Number,
      default() {
        return 500
      },
    },
    highlight: {
      type: Boolean,
    },
  },
  data() {
    return {
      iconFeature: null,
    }
  },
  computed: {
    map() {
      return this.mapCtx && this.mapCtx.map
    },
    vectorSource() {
      return this.vectorCtx && this.vectorCtx.source
    },
    markerStyle() {
      let imgStyle = null
      let currentScale = this.highlight
        ? this.markIcon && this.markIcon.highlightScale || 1.3
        : this.markIcon && this.markIcon.scale || 1
      if (this.markStyle && this.markStyle.type === 'rect') {
        imgStyle = new RegularShape({
          points: 4,
          radius: 30,
          rotation: (Math.PI * 45) / 180,
          fill: new Fill({
            color: this.fillColor,
          }),
        })
        imgStyle.setOpacity(0.5)
      } else if (this.markIcon && this.markIcon.src) {
        imgStyle = new Icon({
          src: this.highlight
            ? this.markIcon.highlightSrc || this.markIcon.src
            : this.markIcon.src,
          anchor: this.markIcon.anchor || [0.5, 0.5],
          scale: currentScale,
        })
      } else {
        imgStyle = new CircleStyle({
          radius: this.markStyle.size || 6,
          fill: new Fill({
            color: this.fillColor,
          }),
        })
      }
      if (this.showLabel) {
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2 * (this.highlight ? 3 : 1),
          }),
          text: new Text({
            font:
              ((this.markLabelConfig && this.markLabelConfig.fontSize) || 12) +
              'px',
            textAlign: 'center',
            offsetY: -(
              70 *
              currentScale *
              ((this.markIcon.anchor && this.markIcon.anchor[1]) || 1)
            ),
            fill: new Fill({
              color: this.markLabelConfig.fontColor || 'rgba(0, 0, 255, 0)',
            }),
            text:
              this.map &&
              this.map.getView().getZoom() > this.markLabelConfig.showZoom
                ? this.showLabel
                : '',
          }),
          image: imgStyle,
        })
      } else {
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2 * (this.highlight ? 3 : 1),
          }),
          image: imgStyle,
        })
      }
    },
  },
  watch: {
    vectorSource(val) {
      if (val) {
        this.addFeature()
      }
    },
    position(coords) {
      if (this.iconFeature && coords) {
        let geometry = this.iconFeature.getGeometry()
        // let prevCoords = geometry.getCoordinates()
        // if (
        //   prevCoords &&
        //   (prevCoords[0] !== coords[0] || prevCoords[1] !== coords[1])
        // ) {
        geometry.setCoordinates(coords)
        // }
      }
    },
    markerStyle(newStyle) {
      if (this.iconFeature) {
        if (this.iconFeature instanceof Array) {
          this.iconFeature.forEach((ele) => {
            this.$nextTick(() => {
              ele.setStyle(newStyle)
            })
          })
        } else if (this.iconFeature instanceof Object) {
          this.$nextTick(() => {
            this.iconFeature.setStyle(newStyle)
          })
        }
      }
    },
  },
  mounted() {
    this.addFeature()
  },
  beforeDestoty() {
    if (this.vectorSource && this.iconFeature) {
      this.vectorSource.removeFeature(this.iconFeature)
    }
  },
  methods: {
    addFeature() {
      if (this.vectorSource && !this.iconFeature) {
        let feature = (this.iconFeature = new Feature({
          geometry: new Point(this.position),
          name: this.name || 'Marker',
        }))
        this.guid && feature.setId(this.guid)
        this.properties && feature.setProperties(this.properties)
        feature.setStyle(this.markerStyle)
        this.vectorSource.addFeature(feature)

        feature.on(
          'change',
          _.throttle((evt) => this.$emit('change', evt), this.changingTimeout)
        )
        feature.on('singleclick', (evt) => {
          this.$emit('click', evt)
        })
      }
    },
  },
}
</script>

<style></style>
