<template>
  <div id="app">
    <GisMap ref="gisMap" projectionCode="EPSG:4326" :extent="extent" :initialZoom="17" v-bind="$attrs" @mapReady="onMapReady" />
  </div>
</template>

<script>

export default {
  name: 'App',
  data () {
    return {
      map: null,
      extent: [102.5, 24.4, 102.6, 24.8],
    }
  },
  methods: {
    onMapReady (map) {
      this.map = map
      // 添加谷歌影像
      this.$refs.gisMap.addTileLayer({
            url:
              'http://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
            zIndex: 0,
          })

      this.map.on('singleclick', evt => {
        console.log('position:   ' + evt.coordinate)
      })
    },
  }
}
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
