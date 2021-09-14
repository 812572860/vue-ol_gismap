<template>
  <div :style="style" @click="$emit('click')">
    <img :src="imgSrc" alt="" style="width:100%;" />
    <span v-if="textField" class="marker-text">{{ data[textField] }}</span>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true
    },
    highlight: {
      type: Boolean
    },
    textField: {
      type: String
    },
    height: Number,
    width: Number,
    highlight: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    style() {
      let style = {
        width: this.width ? `${this.width}px` : "100%",
        height: this.height ? `${this.height}px` : "100%",
        overflow: "hidden",
        margin: "0 auto",
        cursor: "pointer"
      };
      if (this.highlight) {
        style.transform = 'scale(2)';
        style.transformOrigin = '50% 100%';
      }
      return style
    },
    imgSrc() {
      const baseUrl = this.$store.state.app.systemSettings.basePath;
      const imageName = this.data.imageName || this.data.target;
      // if (this.data.option === "switch") {
      //   return this.data.value
      //     ? `${baseUrl}/images/marker/${this.data.target}_open.png`
      //     : `${baseUrl}/images/marker/${this.data.target}_close.png`;
      // } else {
      return `${baseUrl}/images/marker/${imageName}.png`;
      // }
    }
  }
};
</script>

<style lang="scss">
.marker-text {
  color: $--color-default;
  position: absolute;
  top: -18px;
  left: 0;
  font-size: 14px;
  width: 100%;
  word-break: keep-all;
  white-space: nowrap;
  transform: scale(0.6);
  transform-origin: 0 100%;
}
</style>
