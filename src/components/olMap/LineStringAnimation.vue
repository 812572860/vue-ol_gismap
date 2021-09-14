<template>
  <div @mousedown="mousedown" @mouseup="mouseup">
    <slot></slot>
  </div>
</template>

<script>
import { OSM, Vector as VectorSource } from "ol/source.js";
import Feature from "ol/Feature.js";
import { LineString, Point } from "ol/geom.js";
// import { fromLonLat } from "ol/proj.js";
import { Stroke, Style, Text } from "ol/style.js";

import OpFeature from "./Feature";

export default {
  name: "OLineStringAnimation",
  extends: OpFeature,
  data() {
    return {
      timer: null,
      changeStyle: false,
      isMouseDown: false
    };
  },
  props: {
    /**
     * 外边框色
     */
    lineStrokeColor: {
      type: String,
      default() {
        return "rgb(25, 25, 255, 1)";
      }
    },
    strokeColor: {
      type: String,
      default() {
        return "rgb(204, 204, 255, 1)";
      }
    },
    /**
     * 边框宽度
     */
    lineStrokeWidth: {
      type: Number,
      default() {
        return 6;
      }
    },
    strokeWidth: {
      type: Number,
      default() {
        return 8;
      }
    },
    // 标记显示的字段
    textField: {
      type: String,
      default: ""
    },
    // 标记配置
    markLabelConfig: {
      type: Object,
      default: () => ({
        fontSize: 10,
        fontColor: "#19d1ff",
        showZoom: 17
      })
    },
    /**
     * 方向
     */
    direction: {
      type: String,
      default: "right"
    },
    active: {
      type: Boolean
    },
    // 是否显示动画
    showAnimation: {
      type: Boolean,
      default: true
    },
    // 选中样式
    selectedStyle: {
      type: Object
    }
  },
  computed: {
    outlineStroke() {
      const baseStyle = {
        stroke: new Stroke({
          color: this.lineStrokeColor,
          width: this.lineStrokeWidth
        })
      }
      if (this.textField) {
        const showLabel = this.properties[this.textField] || '';
        return new Style({
          ...baseStyle,
          text: new Text({
            font:
              ((this.markLabelConfig && this.markLabelConfig.fontSize) || 12) +
              "px",
            textAlign: "center",
            offsetY: -36,
            fill: new Fill({
              color: this.markLabelConfig.fontColor || "rgba(0, 0, 255, 0)"
            }),
            text:
              this.map && this.map.getView().getZoom() > this.markLabelConfig.showZoom
                ? showLabel
                : ""
          }),
        })
      } else {
        return new Style(baseStyle)
      }
    }
  },
  watch: {
    active: {
      handler(value) {
        if (value) {
          this.feature && this.setStyle(this.feature, 5);
        } else {
          this.feature && this.setStyle(this.feature);
        }
      },
      immediate: true
    },
    showAnimation(value) {
      this.setAnimation();
    }
  },
  mounted() {
    this.addFeature();
  },
  methods: {
    addFeature() {
      if (this.vectorSource && !this.feature) {
        const self = this;
        let feature = (this.feature = new Feature({
          geometry: new LineString(this.coords),
          dashOffset: 0,
          eventList: this.vectorCtx.eventList
        }));
        this.setStyle(feature);
        this.vectorSource.addFeature(feature);

        feature.on("singleclick", evt => {
          this.$emit("click", evt)
        });
        this.mapCtx.dispatchEvent("singleclick");

        // this.registChangeEvent(this.feature);
        // this.vectorCtx.registeHoverEvent(e => {
        //   if (e.selected && e.selected[0].getId() === self.feature.getId()) {
        //     self.setStyle(self.feature, 8)
        //     self.changeStyle = true
        //   } else {
        //     self.changeStyle && self.setStyle(self.feature, )
        //     self.changeStyle = false
        //   }
        // })
        // this.vectorCtx.registeSelectEvent((e) => {
        //   let features = self.vectorSource.getFeatures()
        //     if (e.selected && features.find(item=> item.getId() === self.feature.getId())) {
        //       self.$emit('select', self.bindData)
        //     }
        // }, feature)
      }
    },
    setStyle(feature, strokeWidth = this.strokeWidth) {
      if (feature) {
        feature.setStyle(() => this.getStyle(strokeWidth));
        this.setAnimation();
      }
    },
    setAnimation() {
      if (this.feature) {
        const self = this;
        if (this.showAnimation) {
          this.timer && clearInterval(this.timer);
          this.timer = setInterval(() => {
            let offset = self.feature.get("dashOffset");
            self.direction === "right"
              ? (offset = offset == 15 ? 0 : offset - 2)
              : (offset = offset == 15 ? 0 : offset + 2);
            self.feature.set("dashOffset", offset);
          }, 50);
        } else {
          let offset = self.feature.get("dashOffset");
          self.direction === "right"
            ? (offset = offset == 15 ? 0 : offset - 2)
            : (offset = offset == 15 ? 0 : offset + 2);
          self.feature.set("dashOffset", offset);
        }
      }
    },
    getAnimationStrokeStyle(strokeWidth) {
      return new Style({
        stroke: new Stroke({
          color: this.strokeColor,
          width: strokeWidth,
          lineDash: [7, 18],
          lineDashOffset: this.feature.get("dashOffset")
        })
      });
    },
    getStyle(strokeWidth = this.strokeWidth) {
      return [this.outlineStroke, this.getAnimationStrokeStyle(strokeWidth)];
    },

    mousedown() {
      this.isMouseDown = true;
    },
    mouseup() {
      this.isMouseDown = false;
    }
  }
};
</script>
