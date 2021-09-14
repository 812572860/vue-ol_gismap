<template>
  <div :class="['sensor-type', data.isAlarm ? 'sensor-type_alarm' : 'sensor-type_normal', highlight ? 'sensor-type_highlight' : '']" :style="{backgroundImage: bgImgSrc}">
    <!-- <img :src="images[data.isAlarm ? 'alarm' : 'normal']" alt="" /> -->
    <div class="sensor-target" v-html="data.target"></div>
    <!-- <div :class="['sensor-data', data.isAlarm ? 'sensor-data_alarm' : 'sensor-data_normal']" v-html="(data.value || '--') + '&nbsp;' +  (data.unit || '')"></div> -->
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
      type: Boolean,
      default: false
    }
  },
  computed: {
    bgImgSrc() {
      const baseUrl = this.$store.state.app.systemSettings.basePath;
      let imageName = this.data.isAlarm ? 'sensor-alarm' : 'sensor-normal';
      if (this.highlight) {
        imageName = `${imageName}_highlight`
      }
      return `url(${baseUrl}/images/marker/${imageName}.png)`;
    }
  }
}
</script>

<style lang="scss" scoped>
  .sensor-type {
    height: 58px;
    width: 40px;
    position: relative;
    cursor: pointer;
    display: block;
    text-align: center;
    font-size: 12px;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    transform: scale(0.5);
    transform-origin: 50% 100%;

    &_highlight{
      height: 64px;
      width: 50px;
      transform: scale(0.8);

      .sensor-target {
        line-height: 58px !important;
      }      
    }
    &_alarm {
      color: $--color-alarm-dark;
    }
    &_normal {
      color: $--color-normal-dark;
    }

    .sensor-target {
      height: 100%;
      line-height: 40px;
      text-align: center;
    }
  }

  .sensor-data {
    position: absolute;
    left: 40px;
    top: 0;
    font-size: 10px;
    min-width: 20px;
    height: 24px;
    line-height: 25px;
    display: block;
    text-align: left;
    color: #3567da;
    padding-left: 4px;
    padding-right: 4px;
    background-color: #fff;
    
    // &_alarm {
    //   border: 1px solid $--color-alarm;
    // }
    // &_normal {
    //   border: 1px solid #00e676; 
    // }
  }
</style>
