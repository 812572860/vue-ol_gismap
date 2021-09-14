<template>
  <!-- 测量图层 -->
  <VectorLayer
    ref="meaureLayer"
    :drawType="drawType || 'LineString'"
    :drawnew="drawnew"
    :drawStyle="drawConfig"
    :editable="false"
    @drawstart="onDrawstart"
    @drawend="onDrawend"
    @modifyend="onModifyend"
  >
    <OverlayMarker
      v-for="(item, index) in meaureTooltipList"
      :key="item.guid"
      :guid="item.guid"
      :properties="item"
      :position="item.coord"
      :offset="item.offset"
      positioning="top-left"
      stop-event
      ref="markers"
    >
      <div class="tooltip">
        <div
          v-if="!item.drawing"
          class="remove-btn"
          @click="removeMeaureFeature(item, index)"
        >
          ×
        </div>
        <div :class="item.className">
          <div v-html="item.text"></div>
          <div v-if="item.drawing" class="tooltio-helper">
            单击继续选点，双击结束
          </div>
        </div>
      </div>
    </OverlayMarker>
  </VectorLayer>
</template>

<script>
import * as GeoType from 'ol/geom'
import _ from 'lodash'
import { Style, Fill, Stroke, Circle, Text } from 'ol/style'

import VectorLayer from './VectorLayer'
import OverlayMarker from './Overlay'

export default {
  components: {
    VectorLayer,
    OverlayMarker
  },
  props: {
    /**
     * 绘制类型 Box/Square/Polygon/Point/Circle/LineString
     */
    drawType: {
      type: String,
      default: 'LineString'
    },
    // 画笔样式
    drawConfig: {
      type: Object,
      default: () => ({
        stokeColor: '#ffcc33',
        stokeWidth: 2
      })
    },
    drawnew: {
      type: Boolean,
      default() {
        return false
      }
    },
    changingTimeout: {
      type: Number,
      default() {
        return 100
      }
    }
  },
  data() {
    return {
      measureTooltip: null,
      measureTooltipElement: null,
      helpTooltipElement: null,
      meaureTooltipList: [],
      sketch: null,
      sketchList: [],
      currentMeaureToolTip: null
    }
  },
  computed: {
    map() {
      return this.$refs.meaureLayer.map
    },
    layerSource() {
      return this.$refs.meaureLayer.source
    },
    layer() {
      return this.$refs.meaureLayer.vector
    }
  },
  methods: {
    onDrawstart(evt) {
      // set this.sketch
      this.sketch = evt.feature

      /** @type {ol.Coordinate|undefined} */
      let tooltipCoord = evt.feature.getGeometry().getLastCoordinate()
      // 添加MeaureFeature元素
      let newMeaureFeature = {
        guid: Math.random().toString(16),
        coord: tooltipCoord,
        offset: [0, 20],
        className: 'tooltip-measure',
        text: '单击选择第一个点',
        drawing: true
      }
      this.meaureTooltipList = this.meaureTooltipList.concat([newMeaureFeature])

      const self = this
      this.sketch.getGeometry().on(
        'change',
        _.throttle(evt => {
          let geom = evt.target
          const info = self.getMeaureOutputInfo(geom)

          self.currentMeaureToolTip = {
            ...newMeaureFeature,
            text: info.context,
            coord: info.coord
          }
        }, this.changingTimeout)
      )
      this.sketch.setId(newMeaureFeature.guid)
      this.sketch.setProperties(newMeaureFeature)
      this.currentMeaureToolTip = newMeaureFeature
    },
    onDrawend(evt) {
      this.sketch.setStyle(new Style({
        fill: new Fill({
            color: this.drawConfig.fillColor || 'rgba(0,0,0,.3)'
          }),
          stroke: new Stroke({
            color: this.drawConfig.stokeColor,
            width: this.drawConfig.stokeWidth
          })
      }))
      this.sketchList = this.sketchList.concat([this.sketch])

      this.$nextTick(() => {
        const index = this.meaureTooltipList.findIndex(
          item => item.guid === this.sketch.getProperties().guid
        )
        if (index > -1) {
          let meaureFeature = { ...this.meaureTooltipList[index] }
          if (this.drawType === 'LineString') {
            meaureFeature.text = this.meaureTooltipList[index].text.replace(
              /\s方位：(.)+/g,
              ''
            )
          }
          meaureFeature.offset = [0, 7]
          meaureFeature.className = 'tooltip-static'
          meaureFeature.drawing = false
          this.meaureTooltipList.splice(index, 1, meaureFeature)
        }
        // unset sketch
        this.sketch = null
        this.currentMeaureToolTip = null
        this.$emit('drawend')
      })
    },
    onModifyend(evt) {
      const features = evt.features.getArray()
      if (features && features.length) {
        const toolTipIndex = this.meaureTooltipList.findIndex(item => item.guid === features[0].getId())
        if (toolTipIndex > -1) {
          const info = this.getMeaureOutputInfo(features[0].getGeometry(), false)
          this.meaureTooltipList.splice(toolTipIndex, 1, {
            ...this.meaureTooltipList[toolTipIndex],
            coord: info.coord,
            text: info.context
          })
        }
      }
    },
    removeMeaureFeature(toolTip, index) {
      if (index > -1) {
        this.meaureTooltipList.splice(index, 1)
      }

      const feature = this.sketchList.find(
        item => item.getId() === toolTip.guid
      )
      if (feature) {
        this.layerSource.removeFeature(feature)
      }
    },
    getMeaureOutputInfo(geometry, showAngle = true) {
      let output, tooltipCoord
      if (geometry instanceof GeoType.Polygon) {
        output = this.getFormatArea(geometry)
        tooltipCoord = geometry.getInteriorPoint().getCoordinates()
      } else if (geometry instanceof GeoType.LineString) {
        output = this.getFormatLength(geometry, showAngle)
        tooltipCoord = geometry.getLastCoordinate()
      }
      return {
        context: output,
        coord: tooltipCoord
      }
    },
    /**
     * Format length output.
     * @param {ol.geom.LineString} line The line.
     * @param {Boolean} showCorer 是否显示方位
     * @return {string} The formatted length.
     */
    getFormatLength (line, showCorer = true) {
      let length = line.getLength();
      let output;
      let coordinates = line.getCoordinates();
      // 方位获取
      let corer = "";
      if (coordinates.length >= 2 && showCorer) {
        corer = calcLineCorer(
          coordinates[coordinates.length - 2],
          coordinates[coordinates.length - 1]
        );
        if (corer.toString() === "NaN") {
          corer = "";
        } else {
          corer = " 方位：" + Math.round(corer) + "°";
        }
      }
      if (length > 1000) {
        output = Math.round((length / 1000) * 100) / 100 + " " + "km";
      } else {
        output = Math.round(length * 100) / 100 + " " + "m";
      }
      return output + corer;
    },
    /**
     * Format area output.
     * @param {ol.geom.Polygon} polygon The polygon.
     * @return {string} Formatted area.
     */
    getFormatArea (polygon) {
      let area = polygon.getArea(); // ol.Sphere.getArea(polygon);
      let output;
      if (area > 1000000) {
        output = (area / 1000000).toFixed(3) + " " + "km<sup>2</sup>";
      } else {
        output = Math.round(area) + " " + "m<sup>2</sup>";
      }
      return output;
    },
    /**
     * 获取起点到终点方位
     * @param {Array} P1 起点坐标
     * @param {Array} P2 终点坐标
     * @param {Number} 方位
     */
    calcLineCorer (P1, P2) {
      var y = P2[1] - P1[1];
      var x = P2[0] - P1[0];
      var tan = y / x;
      var c = Math.abs((Math.atan(tan) * 180) / Math.PI);
      if (x >= 0 && y >= 0) {
        c = 90 - c;
      }
      if (x > 0 && y < 0) {
        c = 90 + c;
      }
      if (x < 0 && y < 0) {
        c = 180 + (90 - c);
      }
      if (x < 0 && y > 0) {
        c = 270 + c;
      }
      return c;
    }
  },
  watch: {
    currentMeaureToolTip: {
      handler(value) {
        if (value && this.drawnew) {
          const index = this.meaureTooltipList.findIndex(
            item => item.guid === value.guid
          )
          if (index > -1) {
            this.meaureTooltipList.splice(index, 1, { ...value })
          }
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.tooltip {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  opacity: 0.7;
  white-space: nowrap;

  &-measure {
    opacity: 1;
    font-weight: bold;
  }

  &-static {
    background-color: #ffcc33;
    color: black;
    border: 1px solid white;
  }
  .remove-btn {
    position: absolute;
    top: -16px;
    left: 2px;
    width: 1.2rem;
    height: 1.2rem;
    line-height: 1.2rem;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 600;
    border: 1px solid #ffcc33;
    cursor: pointer;

    &:hover {
      color: #fff;
      border-color: #fff;
    }
  }
}
</style>
