<template>
  <div style="display:none;">
    <slot></slot>
  </div>
</template>

<script>
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Style, Fill, Circle as CircleStyle, Icon, Stroke, RegularShape, Text } from 'ol/style.js';
import { Modify, Select } from 'ol/interaction.js';
import _ from 'lodash';

export default {
  name: 'GeoMarker',
  inject: {
    mapCtx: {
      default() {
        return null;
      }
    },
    vectorCtx: {
      default() {
        return null;
      }
    }
  },
  props: {
    /**
     * 坐标信息
     */
    geoJsonObject: {
      type: Object,
      default: () => ({})
    },
    // 绑定信息
    bindProperty: {
      type: Object
    },
    // 是否高亮
    highlight: {
      type: Boolean,
      default: false
    },
    // 是否注册事件集合
    dispatchEvent: {
      type: Boolean,
      default: false
    },
    /**
     * 填充色
     */
    fillColor: {
      type: [String, Object, CanvasPattern],
      default() {
        return 'rgba(255, 255, 255, 0.2)';
      }
    },
    /**
     * 边框色
     */
    borderColor: {
      type: String,
      default() {
        return '#ffcc33';
      }
    },
    /**
     * 边框宽度
     */
    borderWidth: {
      type: Number,
      default() {
        return 2;
      }
    },
    markIcon: {
      type: Object
    },
    markStyle: {
      type: Object,
      default: () => ({
        type: 'circle',
        size: 6,
        stokeColor: '#ffcc33'
      })
    },
    editable: {
      type: Boolean,
      default: false
    },
    /**
     * change事件防抖wait参数
     */
    changingTimeout: {
      type: Number,
      default() {
        return 500;
      }
    },
    text: {
      type: String
    },
    textOptions: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      geoFeature: null,
      modify: null,
      selector: null
    };
  },
  computed: {
    vectorSource() {
      return this.vectorCtx && this.vectorCtx.source;
    },
    featureStyle() {
      let imgStyle = null;
      let temp = this.highlight ? 3 : 1;
      let currentScale = this.highlight ? (this.markIcon && this.markIcon.highlightScale) || 1.3 : (this.markIcon && this.markIcon.scale) || 1;
      if (this.markStyle && this.markStyle.type === 'rect') {
        imgStyle = new RegularShape({
          points: 4,
          radius: 30,
          rotation: (Math.PI * 45) / 180,
          fill: new Fill({
            color: this.fillColor
          })
        });
        imgStyle.setOpacity(0.5);
      } else if (this.markIcon && this.markIcon.src) {
        imgStyle = new Icon({
          src: this.highlight ? this.markIcon.highlightSrc || this.markIcon.src : this.markIcon.src,
          anchor: this.markIcon.anchor || [0.5, 0.5],
          scale: currentScale,
          rotation: this.markIcon.rotation || 0,
          rotateWithView: this.markIcon.rotateWithView || false
        });
      } else {
        imgStyle = new CircleStyle({
          radius: this.markStyle.size || 6,
          fill: new Fill({
            color: this.fillColor
          })
        });
      }
      if (this.showLabel) {
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2 * (this.highlight ? 3 : 1)
          }),
          text: new Text({
            font: ((this.markLabelConfig && this.markLabelConfig.fontSize) || 12) + 'px',
            textAlign: 'center',
            offsetY: -(60 * ((this.markIcon && this.markIcon.anchor && this.markIcon.anchor[1]) || 1) * currentScale),
            fill: new Fill({
              color: this.markLabelConfig.fontColor || 'rgba(0, 0, 255, 0)'
            }),
            text: this.map && this.map.getView().getZoom() > this.markLabelConfig.showZoom ? this.showLabel : ''
          }),
          image: imgStyle
        });
      } else {
        return new Style({
          fill: new Fill({
            color: this.fillColor
          }),
          stroke: new Stroke({
            color: this.borderColor,
            width: this.borderWidth * temp
          }),
          image: imgStyle
        });
      }
    }
  },
  watch: {
    vectorSource(val) {
      if (val) {
        this.initFeature();
      }
    },
    geoJsonObject(value) {
      if (this.geoFeature && value) {
        // let geometry = this.geoFeature.getGeometry()
        this.drawFeature(value);
      }
    },
    featureStyle(newStyle) {
      if (this.geoFeature) {
        if (this.geoFeature instanceof Array) {
          this.geoFeature.forEach(ele => {
            this.$nextTick(() => {
              ele.setStyle(newStyle);
            });
          });
        } else if (this.geoFeature instanceof Object) {
          this.$nextTick(() => {
            this.geoFeature.setStyle(newStyle);
          });
        }
      }
    },
    editable(value) {
      // if (value) {
      //   this.addModify()
      // } else {
      //   this.removeModify()
      // }
    }
  },
  mounted() {
    this.initFeature();
  },
  beforeDestory() {
    this.removeSelect();
    this.removeModify();
    this.destoryFeature();
  },
  methods: {
    initFeature() {
      if (this.vectorSource) {
        this.drawFeature(this.geoJsonObject);
        // 是否可编辑
        // if (this.editable) {
        //   this.addModify()
        // }
      }
    },
    drawFeature(geoJson) {
      if (this.vectorSource) {
        if (this.geoFeature) {
          this.destoryFeature();
        }
        let feature = (this.geoFeature = new GeoJSON().readFeatures(geoJson));
        if (feature instanceof Array) {
          feature.forEach(ele => {
            ele.setStyle(this.featureStyle);
            this.addFeature(ele);
          });
        } else if (feature instanceof Object) {
          feature.setStyle(this.featureStyle);
          this.addFeature(feature);
        }
      }
    },
    destoryFeature() {
      if (this.vectorSource && this.geoFeature) {
        const self = this;
        if (self.geoFeature && self.geoFeature instanceof Array) {
          self.geoFeature.forEach(ele => {
            self.vectorSource.removeFeature(ele);
          });
        } else if (self.geoFeature instanceof Object) {
          self.vectorSource.removeFeature(self.geoFeature);
        }
      }
    },
    addFeature(feature) {
      this.bindProperty && feature.setProperties({ info: this.bindProperty });
      this.vectorSource.addFeature(feature);
      feature.on('change', _.debounce(this.onChange, this.changingTimeout));
      // 是否注册事件
      if (this.dispatchEvent) {
        feature.on('pointermove', evt => {
          this.$emit('pointermove', evt);
        });
        feature.on('click', evt => {
          this.$emit('click', evt);
        });
      }
    },
    addModify() {
      let map = this.mapCtx && this.mapCtx.map;
      if (map && this.geoFeature) {
        let modifyFeatures = [];
        if (this.geoFeature instanceof Array) {
          modifyFeatures = this.geoFeature;
        } else if (this.geoFeature instanceof Object) {
          modifyFeatures = [this.geoFeature];
        }
        var select = (this.selector = new Select({
          layers: [this.vectorCtx.vector],
          features: modifyFeatures
        }));
        let modify = (this.modify = new Modify({
          features: select.getFeatures(),
          insertVertexCondition: function() {
            // prevent new vertices to be added to the polygons
            return !select
              .getFeatures()
              .getArray()
              .every(function(feature) {
                return feature
                  .getGeometry()
                  .getType()
                  .match(/Polygon/);
              });
          }
        }));
        map.addInteraction(select);
        select.on('select', function(evt) {
          // if (evt.selected[0] == null) return
          //取消选中要素高亮
          this.getFeatures().clear();
        });
        map.addInteraction(modify);
        modify.on('modifyend', evt => {
          let newGeometries = evt.features
            .item(0)
            .getGeometry()
            .getGeometries();
          this.$emit('modifyend', newGeometries);
        });
      }
    },
    removeModify() {
      let map = this.mapCtx && this.mapCtx.map;
      if (map && this.modify) {
        map.removeInteraction(this.modify);
        this.modify = null;
      }
    },
    removeSelect() {
      let map = this.mapCtx && this.mapCtx.map;
      if (map && this.selector) {
        map.removeInteraction(this.selector);
        this.selector = null;
      }
    },
    onChange(evt) {
      this.$emit('change', evt);
    }
  }
};
</script>
