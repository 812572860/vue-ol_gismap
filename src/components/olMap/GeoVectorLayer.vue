<template>
  <div style="display: none;">
    <slot></slot>
  </div>
</template>

<script>
import Feature from 'ol/Feature.js'
import { Style, Fill, Stroke, Circle, Text, Icon } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer.js'
import { Vector as VectorSource } from 'ol/source.js'
import { GeoJSON } from 'ol/format.js'
import { Draw, Modify, Snap } from 'ol/interaction.js'
import { createBox, createRegularPolygon } from 'ol/interaction/Draw'

export default {
  name: 'GeoVectorLayer',
  props: {
    geoJsonObject: {
      type: Object,
    },
    selectedFeature: {
      type: Object,
    },
    // 是否注册事件集合
    dispatchEvent: {
      type: Boolean,
      default: false,
    },
    // 图层默认样式
    defaultStyle: {
      type: Object,
    },
    // 线条颜色
    stokeColor: {
      type: String,
      default: 'rgb(0, 0, 255)',
    },
    // 线条宽度
    stokeWidth: {
      type: Number,
      default: 1,
    },
    // 填充颜色
    fillColor: {
      type: String,
    },
    // 激活状态的填充颜色
    activeFillColor: {
      type: String,
    },
    // 圆的半径，只有geometry的type为Point时，此项才有用
    circleRadius: {
      type: Number,
      default: 5,
    },
    textField: {
      type: String,
      default: '',
    },
    markLabelConfig: {
      type: Object,
      default: () => ({
        fontSize: 10,
        fontColor: '#19d1ff',
        showZoom: 18,
      }),
    },
    /**
     * 是否启用编辑
     */
    editable: {
      type: Boolean,
      default() {
        return false
      },
    },
    drawnew: {
      type: Boolean,
      default() {
        return false
      },
    },
    /**
     * 绘制类型 Box/Square/Polygon/Point/Circle/LineString
     */
    drawType: {
      type: String,
    },
    zIndex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      source: null,
      vector: null,
      // selectedFeature: null
    }
  },
  mounted() {
    this.addVectorLayer()
  },
  provide() {
    return {
      vectorCtx: this,
    }
  },
  inject: {
    mapCtx: {
      default() {
        return null
      },
    },
  },
  watch: {
    map(value) {
      if (value) {
        this.addVectorLayer()
      }
    },
    editable(value) {
      if (value) {
        this.addModify()
      } else {
        this.removeModify()
      }
    },
    drawnew(value) {
      if (value) {
        this.addDraw()
      } else {
        this.removeDraw()
      }
    },
    selectedFeature(value, preValue) {
      if (preValue) {
        preValue instanceof Feature &&
          preValue.setStyle(this.setFeatrueStyle(preValue))
      }
      if (value) {
        value instanceof Feature &&
          value.setStyle(this.setFeatrueStyle(value, true))
      }
    },
  },
  computed: {
    map() {
      return this.mapCtx && this.mapCtx.map
    },
  },
  methods: {
    // 添加图层
    addVectorLayer() {
      let map = this.map
      if (map && !this.source) {
        let features = new GeoJSON().readFeatures(this.geoJsonObject)
        this.source = new VectorSource({
          features: features,
        })
        this.vector = new VectorLayer({
          source: this.source,
          zIndex: this.zIndex,
          style: (ele) => this.setFeatrueStyle(ele),
        })

        // 是否可编辑
        if (this.editable) {
          this.addModify()
        }
        // 是否可添加
        if (this.drawnew) {
          this.addDraw()
        }
        // 是否注册事件
        if (this.dispatchEvent) {
          //   this.eventList.map(item => {
          features.forEach((f) => {
            let prop = f.getProperties()
            if (!prop.hasSetEvent) {
              f.on('singleclick', (evt) => {
                // this.selectedFeature = evt.target
                this.$emit('singleclick', evt)
              })
              f.on('pointermove', (evt) => {
                // this.selectedFeature = evt.target
                this.$emit('pointermove', evt)
              })
              f.setProperties({ ...prop, hasSetEvent: true })
            }
          })
          // });
        }
        map.addLayer(this.vector)
      }
    },
    setFeatrueStyle(ele, selected = false) {
      const self = this
      const featureType = ele.getGeometry().getType()
      // 获取元素配置中的样式配置信息
      const featureStyleConfig =
        ele.getProperties().style || ele.getProperties()
      const stokeWidth =
        (featureStyleConfig && featureStyleConfig.stokeWidth) || this.stokeWidth
      const fillColor =
        (featureStyleConfig && featureStyleConfig.fillColor) || this.fillColor

      let style = {}

      if (featureType === 'Point') {
        let image
        if (
          featureStyleConfig &&
          featureStyleConfig.markIcon &&
          featureStyleConfig.markIcon.src
        ) {
          image = new Icon({
            src: featureStyleConfig.highlight
              ? featureStyleConfig.markIcon.highlightSrc ||
                featureStyleConfig.markIcon.src
              : featureStyleConfig.markIcon.src,
            anchor: featureStyleConfig.markIcon.anchor || [0.5, 0.5],
            scale: featureStyleConfig.markIcon.scale,
            rotation: featureStyleConfig.markIcon.rotation || 0,
            rotateWithView: featureStyleConfig.markIcon.rotateWithView || false,
          })
        } else {
          image = new Circle({
            radius: this.circleRadius,
            fill: null,
            stroke: new Stroke({
              color:
                (featureStyleConfig && featureStyleConfig.stokeColor) ||
                this.stokeColor,
              width: selected ? 6 * stokeWidth : stokeWidth,
            }),
          })
        }
        this.setScaleWithView(image, featureStyleConfig)
        style = { image }
      } else {
        if (this.stokeColor) {
          style.stroke = new Stroke({
            color:
              (featureStyleConfig && featureStyleConfig.stokeColor) ||
              this.stokeColor,
            width: selected ? 6 * stokeWidth : stokeWidth,
          })
        }
        if (fillColor) {
          style.fill = new Fill({
            color: selected ? this.activeFillColor : fillColor,
          })
        }
        if (this.textField) {
          const showLabel = ele.getProperties()[self.textField]
          style.text = new Text({
            font:
              ((self.markLabelConfig && self.markLabelConfig.fontSize) || 12) +
              'px',
            textAlign: 'center',
            offsetY: -14,
            fill: new Fill({
              color: self.markLabelConfig.fontColor || 'rgba(0, 0, 255, 0)',
            }),
            rotation: self.rotation,
            text:
              self.map.getView().getZoom() > self.markLabelConfig.showZoom
                ? showLabel
                : '',
          })
        }
      }

      return new Style(style)
    },
    setScaleWithView(style, featureStyleConfig) {
      if (featureStyleConfig && featureStyleConfig.sizeWithView && this.map) {
        let resolution = this.map.getView().getResolution()
        if (resolution) {
          // 图标大小随视口进行缩放
          style.setScale(
            this.map
              .getView()
              .getResolutionForZoom(
                8 / (featureStyleConfig.markIcon.scale || 1)
              ) / resolution
          )
        }
      }
    },
    addModify() {
      let map = this.map
      if (map && this.source) {
        let modify = (this.modify = new Modify({ source: this.source }))
        map.addInteraction(modify)
      }
    },
    removeModify() {
      let map = this.map
      if (map && this.modify) {
        map.removeInteraction(this.modify)
        this.modify = null
      }
    },
    removeDraw() {
      let map = this.map
      if (map && this.draw) {
        map.removeInteraction(this.draw)
        map.removeInteraction(this.snap)
        this.draw = null
        this.snap = null
      }
    },
    addDraw() {
      if (!this.map) {
        return
      }
      // 方框
      if (['Box', 'Square'].indexOf(this.drawType) >= 0) {
        let geometryFunction = {
          Box: createBox(),
          Square: createRegularPolygon(4),
        }
        this.draw = new Draw({
          source: this.source,
          type: 'Circle',
          geometryFunction: geometryFunction[this.drawType],
          stopClick: true,
        })
      } else {
        this.draw = new Draw({
          source: this.source,
          type: this.drawType,
        })
      }
      this.map.addInteraction(this.draw)
      let snap = new Snap({ source: this.source })
      this.map.addInteraction(snap)
      this.draw.on('drawend', (event) => {
        this.$emit('drawend', event)
      })
    },
  },
  beforeDestroy() {
    let map = this.map
    if (map) {
      this.removeModify()
      this.removeDraw()
      map.removeLayer(this.vector)
    }
  },
}
</script>

<style scoped></style>
