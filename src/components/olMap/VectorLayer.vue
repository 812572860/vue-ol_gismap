<template>
  <div style="display: none;">
    <slot></slot>
  </div>
</template>

<script>
import { Style, Fill, Stroke, Circle, Text } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer.js'
import { Vector as VectorSource } from 'ol/source.js'
import { GeoJSON } from 'ol/format.js'
import { Draw, Modify, Snap, Select } from 'ol/interaction.js'
import { createBox, createRegularPolygon } from 'ol/interaction/Draw'
export default {
  name: 'VectorLayer',
  props: {
    // 线条颜色
    stokeColor: {
      type: String,
      default: '#ffcc33',
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
    // 画笔样式，设备shokeColor  stokeWidth  fillColor
    drawStyle: {
      type: Object,
    },
    // 画笔显示提示文字
    drawDisplayText: {
      type: String,
    },
    zIndex: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      source: null,
      vector: null,
      selector: null,
      modify: null,
      snap: null,
      draw: null,
    }
  },
  mounted() {
    // this.addVectorLayer()
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
    visible(value) {
      this.vector && this.vector.setVisible(value)
    },
  },
  computed: {
    map() {
      return this.mapCtx && this.mapCtx.map
    },
    styles() {
      let style = {
        stroke: new Stroke({
          color: this.stokeColor,
          width: this.stokeWidth,
        }),
      }
      if (this.fillColor) {
        style.fill = new Fill({
          color: this.fillColor,
        })
      }
      return new Style(style)
    },
  },
  methods: {
    // 添加图层
    addVectorLayer() {
      let map = this.map
      if (map && !this.source) {
        this.source = new VectorSource()
        this.vector = new VectorLayer({
          source: this.source,
          zIndex: this.zIndex,
          style: this.styles,
        })
        map.addLayer(this.vector)
        // 是否可编辑
        if (this.editable) {
          this.addModify()
        }
        // 是否可添加
        if (this.drawnew) {
          this.addDraw()
        }
      }
    },
    addModify() {
      let map = this.map
      if (map && this.source) {
        // let modify = (this.modify = new Modify({ source: this.source }))
        // map.addInteraction(modify)
        var select = (this.selector = new Select({
          layers: [this.vector],
          style: false,
        }))
        let modify = (this.modify = new Modify({
          features: select.getFeatures(),
          // insertVertexCondition: function() {
          //   // prevent new vertices to be added to the polygons
          //   return !select
          //     .getFeatures()
          //     .getArray()
          //     .every(function(feature) {
          //       return feature
          //         .getGeometry()
          //         .getType()
          //         .match(/Polygon/)
          //     })
          // }
        }))
        map.addInteraction(select)
        map.addInteraction(modify)
        modify.on('modifyend', (evt) => {
          this.$emit('modifyend', evt)
        })
      }
    },
    removeModify() {
      let map = this.map
      if (map && this.modify) {
        map.removeInteraction(this.modify)
        map.removeInteraction(this.selector)
        this.modify = null
        this.selector = null
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
      this.draw && this.map.removeInteraction(this.draw)

      let drawInfo = {
        source: this.source,
        type: this.drawType,
      }
      // 方框
      if (['Box', 'Square'].indexOf(this.drawType) >= 0) {
        let geometryFunction = {
          Box: createBox(),
          Square: createRegularPolygon(4),
        }
        drawInfo = {
          source: this.source,
          type: 'Circle',
          geometryFunction: geometryFunction[this.drawType],
          stopClick: true,
        }
      }
      if (this.drawStyle) {
        let drawStyleConfig = {
          fill: new Fill({
            color: this.drawStyle.fillColor || 'rgba(0,0,0,.3)',
          }),
          stroke: new Stroke({
            color: this.drawStyle.stokeColor,
            width: this.drawStyle.stokeWidth,
          }),
        }
        // if (this.drawDisplayText) {
        //   drawStyleConfig.text = new Text({
        //     font: ((this.drawStyle && this.drawStyle.fontSize) || 12) + 'px',
        //     textAlign: 'center',
        //     offsetY: -20,
        //     fill: new Fill({
        //       color: this.drawStyle.fontColor || 'rgba(0, 0, 255, 0)'
        //     }),
        //     text: this.drawDisplayText
        //   })
        // } else {
        drawStyleConfig.image = new Circle({
          radius: 5,
          stroke: new Stroke({
            color: this.drawStyle.stokeColor,
          }),
          fill: new Fill({
            color: this.drawStyle.fillColor || 'rgba(0,0,0,.3)',
          }),
        })
        // }
        drawInfo.style = new Style(drawStyleConfig)
      }
      this.draw = new Draw(drawInfo)

      this.map.addInteraction(this.draw)
      // let snap = new Snap({ source: this.source })
      // this.map.addInteraction(snap)

      this.draw.on('drawstart', (event) => {
        this.$emit('drawstart', event)
      })
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
