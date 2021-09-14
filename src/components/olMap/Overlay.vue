<template>
  <div
    :class="[className, highlight ? 'overlay-selected' : '']"
    @click="onClick"
    @mousedown="mousedown"
    @mouseup="mouseup"
    @mousemove="mousemove"
  >
    <slot />
  </div>
</template>
<script>
import Overlay from "ol/Overlay";
import DragPan from "ol/interaction/DragPan";
export default {
  name: "Overlay",
  data() {
    return {
      loaded: false,
      marker: null,
      markerPosition: this.position.concat([]),
      dragPan: null,
      isMouseDrag: false,
      isMouseDown: false
    };
  },
  props: {
    guid: {
      type: [String, Number],
      default: ''
    },
    properties: {
      type: [Object, String]
    },
    /**
     * 坐标
     */
    position: {
      type: [Array],
      required: true
    },
    /**
     * 布局，默认：top-left
     */
    positioning: {
      type: String,
      default: () => {
        return "top-left";
      }
    },
    /**
     * 覆盖特偏移
     */
    offset: {
      type: Array,
      default: () => {
        return [0, 0];
      }
    },
    /**
     * 是否可拖放
     */
    draggable: {
      type: Boolean,
      default: false
    },
    /**
     * 阻止冒泡
     */
    stopEvent: {
      type: Boolean,
      default: false
    },
    className: {
      type: String
    },
    highlight: {
      type: Boolean
    }
  },
  mounted() {
    this.init();
  },
  inject: {
    mapCtx: {
      default() {
        return null;
      }
    }
  },
  watch: {
    parentMap() {
      this.addToMap();
    },
    /**
     * 坐标变换时重新设置
     */
    position(value) {
      this.markerPosition = value;
      if (this.marker) {
        this.marker.setPosition(value);
      }
    },
    offset(value) {
      if (this.marker) {
        this.marker.setOffset(value);
      }
    },
    highlight (value) {
      if (this.marker) {
        this.marker.setElement(this.$el)
      }
    }
  },
  computed: {
    parentMap() {
      return this.mapCtx && this.mapCtx.map;
    }
  },
  methods: {
    onClick(){
      this.$emit('click', {target: this.marker})
    },
    init() {
      if (this.parentMap) {
        this.addToMap();
      }
    },
    addToMap() {
      if (!this.loaded) {
        var overlay = (this.marker = new Overlay({
          id: this.guid,
          position: this.markerPosition,
          element: this.$el,
          offset: this.offset,
          stopEvent: this.stopEvent
        }));
        this.properties && overlay.setProperties(this.properties)
        this.parentMap.addOverlay(overlay);
        overlay.setPositioning(this.positioning);

        if (this.draggable) {
          this.enableDrag();
        }
      }
      this.loaded = true;
    },
    /**
     * @public
     * 获取坐标
     */
    getPosition() {
      return this.markerPosition;
    },
    /**
     * @public
     * 启用拖放
     * @event drop 拖动完成事件 参数(marker,evt)
     */
    enableDrag() {
      let map = this.parentMap;
      let marker = this.marker;
      // let markerEl = this.$el
      let self = this;
      map.getInteractions().forEach(function(interaction) {
        if (interaction instanceof DragPan) {
          self.dragPan = interaction;
        }
      });

      // markerEl.addEventListener('mousedown', function() {
      //   dragPan.setActive(false)
      //   marker.set('dragging', true)
      //   isMouseDown = true
      // })
      // markerEl.addEventListener('mouseup', function(evt) {
      //   if (marker.get('dragging') === true) {
      //     dragPan.setActive(true)
      //     marker.set('dragging', false)
      //     marker.set('stopEvent', false)
      //     // drop放下事件
      //     self.$emit('drop', marker.get('position'))
      //   }
      // })

      map.on("pointermove", function(evt) {
        if (marker.get("dragging") && self.isMouseDrag) {
          var dd2 = map.getPixelFromCoordinate(evt.coordinate);
          var newX = dd2[0]; // - self.offset[0] * 2 //减去偏移量
          var newY = dd2[1]; // + self.offset[1] * 2
          var newPoint = map.getCoordinateFromPixel([newX, newY]);
          marker.setPosition(newPoint);
        }
        // if (marker.get("dragging") === true) {
        //   marker.setPosition(evt.coordinate)
        // }
      });

      // map.on('mouseup', function(evt) {
      //   if (marker.get('dragging') === true) {
      //     dragPan.setActive(true)
      //     marker.set('dragging', false)
      //     marker.set('stopEvent', false)
      //     self.markerPosition = evt.coordinate
      //     // drop放下事件
      //     self.$emit('drop', marker, evt)
      //   }
      // })
    },
    mousedown() {
      this.isMouseDown = true;
      if (this.dragPan && this.marker) {
        this.dragPan.setActive(false);
        this.marker.set("dragging", true);
      }
    },
    mouseup() {
      if (this.draggable) {
        if (this.isMouseDrag) {
          if (this.marker.get("dragging") === true) {
            // drop放下事件
            this.$emit("drop", this.marker.get("position"));
          }
        }
        this.dragPan.setActive(true);
        this.marker.set("dragging", false);
        this.isMouseDown = false;
      }
    },
    mousemove() {
      if (this.isMouseDown) {
        this.isMouseDrag = true;
      } else {
        this.isMouseDrag = false;
      }
      this.$emit('mousemove')
    },
    /**
     * @public
     * @description
     * 定位为中心点
     */
    locateToCenter() {
      let map = this.parentMap;
      let view = map.getView();
      view.animate({ center: this.markerPosition, duration: 1000 });
    },
    /**
     * @public
     * 定位到中心点并闪烁
     */
    centerAndFlash() {
      this.locateToCenter();
      setTimeout(this.flash, 1000);
    },
    /**
     * @public
     * 闪烁
     * @param {Number} timeout 闪烁时间，0不停止
     */
    flash(timeout = 1500) {
      let marker = this.$el;
      let flashClass = " animated flash" + (!timeout ? " infinite" : "");
      if (marker.className.indexOf(flashClass) < 0) {
        marker.className = marker.className + flashClass;
      }
      if (timeout) {
        setTimeout(this.stopFlash, timeout);
      }
    },
    /**
     * @public
     * 停止闪烁
     */
    stopFlash() {
      let marker = this.$el;
      marker.className = marker.className
        .replace(/animated flash/g, "")
        .replace(/infinite/g, "");
    },
    /**
     * 刷新数据展示
     */
    refresh() {
      let marker = this.marker;
      this.$nextTick(() => {
        marker && marker.setElement(this.$el);
        marker.setPosition(this.markerPosition);
      });
    }
  },
  /**
   * 组件销毁钩子
   */
  beforeDestory() {
    if (this.loaded && this.marker) {
      this.parentMap && this.parentMap.removeOverlay(this.marker);
    }
  }
};
</script>

<style lang="scss" scoped>
.overlay-selected {
  transform: scale(1.5);
  transform-origin: 50% 100%;
}
</style>